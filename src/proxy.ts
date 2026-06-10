import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { verifyToken } from '@/lib/jwt'

// Initialize NextAuth instance safe for Edge runtime (no database imports)
const { auth: nextAuthMiddleware } = NextAuth(authConfig)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Prevent header spoofing by stripping custom user context headers from the incoming request
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('x-user-id')
  requestHeaders.delete('x-user-email')
  requestHeaders.delete('x-user-role')

  // 1. API Route Protection & User Forwarding
  if (pathname.startsWith('/api')) {
    // Skip verification check on auth API routes
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    const authHeader = request.headers.get('authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = await verifyToken(token)

      if (!decoded) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        )
      }

      // Forward verified mobile user contexts
      requestHeaders.set('x-user-id', decoded.userId)
      requestHeaders.set('x-user-email', decoded.email)
      requestHeaders.set('x-user-role', decoded.role)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // Fallback: Check if there's an active NextAuth web session
    let userId = ''
    let userEmail = ''
    let userRole = 'USER'

    const session = await (nextAuthMiddleware as any)(request)
    if (session && session.auth?.user) {
      const user = session.auth.user
      userId = user.id || ''
      userEmail = user.email || ''
      userRole = (user as any).role || 'USER'
    }

    // If nextAuthMiddleware didn't yield the user context, try parsing JWT from cookies directly
    if (!userId) {
      try {
        const { getToken } = await import('next-auth/jwt')
        const cookies = request.cookies
        const cookieNames = [
          '__Secure-authjs.session-token',
          'authjs.session-token',
          '__Secure-next-auth.session-token',
          'next-auth.session-token',
        ]
        const activeCookieName = cookieNames.find((name) => cookies.has(name))

        const token = activeCookieName
          ? await getToken({
              req: request,
              secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
              cookieName: activeCookieName,
              secureCookie: activeCookieName?.startsWith('__Secure-'),
            })
          : null

        if (token) {
          userId = (token.id as string) || (token.sub as string) || ''
          userEmail = token.email || ''
          userRole = (token.role as string) || 'USER'
        }
      } catch (err) {
        console.error('Failed to extract token via getToken fallback:', err)
      }
    }

    if (userId) {
      requestHeaders.set('x-user-id', userId)
      requestHeaders.set('x-user-email', userEmail)
      requestHeaders.set('x-user-role', userRole)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // Let API routes pass through with stripped headers.
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 2. Web Page Protection (NextAuth edge validation)
  return (nextAuthMiddleware as any)(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
