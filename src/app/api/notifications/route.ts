import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  const userId = session?.user?.id || request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'
  const unreadOnly = searchParams.get('unread') === 'true'

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
  const skip = (pageNum - 1) * limitNum

  const where = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
  }

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId, readAt: null },
      }),
    ])

    const totalPages = Math.ceil(total / limitNum)

    return NextResponse.json({
      success: true,
      notifications,
      page: pageNum,
      totalPages,
      total,
      unreadCount,
    })
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 },
    )
  }
}
