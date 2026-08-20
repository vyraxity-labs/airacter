import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/auth'

function parseUserAgent(userAgent: string) {
  let os = 'Unknown OS'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X'))
    os = 'macOS'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad'))
    os = 'iOS'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('Linux')) os = 'Linux'

  let browser = 'Unknown Browser'
  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Chrome') && !userAgent.includes('Chromium'))
    browser = 'Chrome'
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
    browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  else if (userAgent.includes('Trident') || userAgent.includes('MSIE'))
    browser = 'Internet Explorer'

  return { os, browser }
}

export async function GET(request: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get current connection details
    const userAgent = request.headers.get('user-agent') || ''
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    const { os, browser } = parseUserAgent(userAgent)

    // 2. Fetch DB sessions
    let dbSessions = await db.session.findMany({
      where: { userId },
      orderBy: { expires: 'desc' },
    })

    // 3. Extract the active NextAuth cookie value to detect the current session
    const cookieStore = await cookies()
    const cookieNames = [
      '__Secure-authjs.session-token',
      'authjs.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.session-token',
    ]
    let activeSessionToken = ''
    for (const name of cookieNames) {
      const cookie = cookieStore.get(name)
      if (cookie) {
        activeSessionToken = cookie.value
        break
      }
    }



    // 5. Format session objects
    const sessions = dbSessions.map((session) => {
      let device = 'Browser Session'
      let ipAddress = 'Unknown IP'
      let isCurrent = false

      if (session.sessionToken.startsWith('session::')) {
        const parts = session.sessionToken.split('::')
        device = parts[1] || device
        ipAddress = parts[2] || ipAddress
      } else {
        // NextAuth database session or other token format
        device = `${browser} on ${os}`
        ipAddress = ip
      }

      // Check if this session matches the current web session token
      if (activeSessionToken && session.sessionToken === activeSessionToken) {
        isCurrent = true
      }

      return {
        id: session.id,
        device,
        ipAddress,
        lastActive: session.expires.toISOString(), // Use expires or a relative time estimation
        isCurrent,
      }
    })

    // Make sure we have at least one session marked as "current" (the current browser request)
    const hasCurrent = sessions.some((s) => s.isCurrent)
    if (!hasCurrent) {
      sessions.unshift({
        id: 'current-session-context',
        device: `${browser} on ${os}`,
        ipAddress: ip,
        lastActive: new Date().toISOString(),
        isCurrent: true,
      })
    }

    return NextResponse.json({ success: true, sessions })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active sessions' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find active cookie token
    const cookieStore = await cookies()
    const cookieNames = [
      '__Secure-authjs.session-token',
      'authjs.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.session-token',
    ]
    let activeSessionToken = ''
    for (const name of cookieNames) {
      const cookie = cookieStore.get(name)
      if (cookie) {
        activeSessionToken = cookie.value
        break
      }
    }

    // Delete all sessions for the user EXCEPT the active one
    if (activeSessionToken) {
      await db.session.deleteMany({
        where: {
          userId,
          sessionToken: {
            not: activeSessionToken,
          },
        },
      })
    } else {
      // If no active session token cookie found (e.g. API request via mobile Bearer token),
      // we can clear all sessions
      await db.session.deleteMany({
        where: { userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to clear other sessions' },
      { status: 500 },
    )
  }
}
