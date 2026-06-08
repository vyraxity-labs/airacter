import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const chatUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters'),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

// PATCH /api/chats/[id]: Update the title of a specific chat thread
export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const result = chatUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const { title } = result.data

    // Check ownership
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

    const updatedChat = await db.chat.update({
      where: { id },
      data: { title },
      include: {
        character: {
          select: {
            id: true,
            slug: true,
            name: true,
            avatarType: true,
            avatarValue: true,
            avatarColor: true,
          },
        },
      },
    })

    return NextResponse.json({ chat: updatedChat })
  } catch (error: any) {
    console.error('PATCH /api/chats/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update chat thread' },
      { status: 500 },
    )
  }
}

// DELETE /api/chats/[id]: Delete an entire chat thread
export async function DELETE(request: Request, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check ownership
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

    // Delete the chat. Cascadings are defined at database level (onDelete: Cascade).
    await db.chat.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/chats/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat thread' },
      { status: 500 },
    )
  }
}
