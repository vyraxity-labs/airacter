import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const userId = session?.user?.id || request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const notification = await db.notification.findFirst({
      where: { id, userId },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updated = await db.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      notification: updated,
    })
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
