import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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

    // Retrieve the chat and its messages in a single query to verify ownership and fetch history
    const chat = await db.chat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
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
    const messages = chat.messages

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('GET /api/chats/[id]/messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 },
    )
  }
}
