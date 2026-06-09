import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getUserTokenBalance } from '@/lib/tokens'
import { streamChatResponse, countTokens, ChatMessage } from '@/lib/ai-gateway'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

// POST /api/chats/[id]/regenerate: Regenerate the last assistant response in a chat thread
export async function POST(request: Request, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

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
        { status: 402 }, // Payment Required
      )
    }

    // 3. Fetch current message history
    const dbMessages = await db.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    })

    // Find the last user message in the thread
    let lastUserIndex = -1
    for (let i = dbMessages.length - 1; i >= 0; i--) {
      if (dbMessages[i].role === 'user') {
        lastUserIndex = i
        break
      }
    }

    if (lastUserIndex === -1) {
      return NextResponse.json(
        { error: 'No user message to regenerate a response for' },
        { status: 400 },
      )
    }

    const lastUserMessage = dbMessages[lastUserIndex]

    // Reconstruct history up to (but excluding) the last user message
    const history: ChatMessage[] = dbMessages
      .slice(0, lastUserIndex)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    // Update chat timestamp
    await db.chat.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    // 4. Initialize streaming response from Gemini SDK
    const responseStream = await streamChatResponse(
      chat.systemPromptSnapshot,
      history,
      lastUserMessage.content,
    )

    // 5. Delete all messages after this user message (deferred until stream successfully starts)
    const messagesToDelete = dbMessages.slice(lastUserIndex + 1)
    if (messagesToDelete.length > 0) {
      await db.message.deleteMany({
        where: {
          id: {
            in: messagesToDelete.map((m) => m.id),
          },
        },
      })
    }

    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponseText = ''
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text || ''
            fullResponseText += text

            // Stream chunk back via SSE
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`),
            )
          }

          // 6. Write completed regenerated assistant message to database
          const assistantMessage = await db.message.create({
            data: {
              chatId: id,
              role: 'assistant',
              content: fullResponseText,
            },
          })

          // 7. Calculate exact token usage
          const historyWithUser = [
            ...history,
            { role: 'user' as const, content: lastUserMessage.content },
          ]
          const [inputTokens, outputTokens] = await Promise.all([
            countTokens(historyWithUser, chat.systemPromptSnapshot),
            countTokens([{ role: 'assistant', content: fullResponseText }]),
          ])
          const totalTokens = inputTokens + outputTokens

          // 8. Log debit transaction
          await db.tokenTransaction.create({
            data: {
              userId,
              type: 'debit_message',
              direction: 'debit',
              amount: totalTokens,
              referenceId: assistantMessage.id,
              metadata: {
                inputTokens,
                outputTokens,
                chatId: id,
                regenerated: true,
              },
            },
          })

          // Stream termination SSE containing exact transaction metrics
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
          console.error('Gemini SSE stream processing error (Regenerate):', err)

          if (fullResponseText.trim().length > 0) {
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
                { role: 'user' as const, content: lastUserMessage.content },
              ]
              const [inputTokens, outputTokens] = await Promise.all([
                countTokens(historyWithUser, chat.systemPromptSnapshot),
                countTokens([{ role: 'assistant', content: fullResponseText }]),
              ])
              const totalTokens = inputTokens + outputTokens

              await db.tokenTransaction.create({
                data: {
                  userId,
                  type: 'debit_message',
                  direction: 'debit',
                  amount: totalTokens,
                  referenceId: assistantMessage.id,
                  metadata: {
                    inputTokens,
                    outputTokens,
                    interrupted: true,
                    chatId: id,
                    regenerated: true,
                  },
                },
              })
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
    console.error('POST /api/chats/[id]/regenerate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate response' },
      { status: 500 },
    )
  }
}
