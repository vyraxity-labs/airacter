import { db } from '@/lib/db'
import { after, NextResponse } from 'next/server'
import { getUserTokenBalance, debitTokens } from '@/lib/tokens'
import { streamChatResponse, countTokens, ChatMessage } from '@/lib/ai-gateway'
import { z } from 'zod'
import { autoTitleChat } from '@/lib/auto-titling'
import { TransactionType } from '@/generated/prisma/enums'

const messageCreateSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

// GET /api/chats/[id]/messages: Fetch the message history of a chat thread
export async function GET(request: Request, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check ownership of the chat
    const chat = await db.chat.findUnique({
      where: { id },
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat thread not found' },
        { status: 404 },
      )
    }

    if (chat.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this chat' },
        { status: 403 },
      )
    }

    // Retrieve all messages for this chat, sorted chronologically
    const messages = await db.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('GET /api/chats/[id]/messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 },
    )
  }
}

// POST /api/chats/[id]/messages: Dispatch user message and stream AI response (SSE)
export async function POST(request: Request, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const result = messageCreateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const { content } = result.data

    // 1. Verify chat exists and belongs to user
    const chat = await db.chat.findUnique({
      where: { id },
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat thread not found' },
        { status: 404 },
      )
    }

    if (chat.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this chat' },
        { status: 403 },
      )
    }

    // 2. Confirm balance > 0 in ledger
    const balance = await getUserTokenBalance(userId)
    if (balance <= 0) {
      return NextResponse.json(
        {
          error:
            'Insufficient token balance. Please purchase more tokens to continue chatting.',
        },
        { status: 402 }, // 402 Payment Required
      )
    }

    // 3. Fetch past messages for this chat thread context
    const dbMessages = await db.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    })

    const history: ChatMessage[] = dbMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const isFirstMessage = dbMessages.length === 0

    // 4. Create user message record in the database
    await db.message.create({
      data: {
        chatId: id,
        role: 'user',
        content,
      },
    })

    // Update the chat's updatedAt field
    await db.chat.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    if (isFirstMessage) {
      // Trigger background auto-titling asynchronously
      after(
        autoTitleChat(id, content).catch((err) => {
          console.error('Failed to trigger background auto-titling:', err)
        }),
      )
    }

    // 5. Initialize streaming response from Gemini SDK
    const responseStream = await streamChatResponse(
      chat.systemPromptSnapshot,
      history,
      content,
    )

    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponseText = ''
        let completedSaved = false
        try {
          // Iterate over chunks returned by Gemini client
          for await (const chunk of responseStream) {
            const text = chunk.text || ''
            fullResponseText += text

            // Enqueue chunk formatted as Server-Sent Event (SSE)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`),
            )
          }

          // 6. Write completed assistant message to database
          const assistantMessage = await db.message.create({
            data: {
              chatId: id,
              role: 'assistant',
              content: fullResponseText,
            },
          })
          completedSaved = true

          // 7. Calculate exact token usage
          const historyWithUser = [
            ...history,
            { role: 'user' as const, content },
          ]
          const [inputTokens, outputTokens] = await Promise.all([
            countTokens(historyWithUser, chat.systemPromptSnapshot),
            countTokens([{ role: 'assistant', content: fullResponseText }]),
          ])
          const totalTokens = inputTokens + outputTokens

          // 8. Log debit token transaction (canonical FIFO method)
          await debitTokens(
            userId,
            totalTokens,
            assistantMessage.id,
            {
              inputTokens,
              outputTokens,
              chatId: id,
            },
            TransactionType.debit_message
          )

          // Enqueue termination SSE containing exact transaction metrics
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                messageId: assistantMessage.id,
                inputTokens,
                outputTokens,
                totalTokens,
              })}\n\n`,
            ),
          )
        } catch (err: any) {
          console.error('Gemini SSE stream processing error:', err)

          // Fallback logic: if we generated some response before failure, write it to database
          if (!completedSaved && fullResponseText.trim().length > 0) {
            try {
              const assistantMessage = await db.message.create({
                data: {
                  chatId: id,
                  role: 'assistant',
                  content: fullResponseText + ' [Stream Interrupted]',
                },
              })

              const historyWithUser = [
                ...history,
                { role: 'user' as const, content },
              ]
              const [inputTokens, outputTokens] = await Promise.all([
                countTokens(historyWithUser, chat.systemPromptSnapshot),
                countTokens([{ role: 'assistant', content: fullResponseText }]),
              ])
              const totalTokens = inputTokens + outputTokens

              await debitTokens(
                userId,
                totalTokens,
                assistantMessage.id,
                {
                  inputTokens,
                  outputTokens,
                  interrupted: true,
                  chatId: id,
                },
                TransactionType.debit_message
              )
            } catch (dbErr) {
              console.error('Failed to save partial response:', dbErr)
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: err.message || 'Streaming error' })}\n\n`,
            ),
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('POST /api/chats/[id]/messages error:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch message' },
      { status: 500 },
    )
  }
}
