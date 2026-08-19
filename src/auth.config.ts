import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import {
  API_ROUTES_PREFIX,
  AUTH_PAGES_PREFIX,
  CHATS_PAGE,
  HOME_PAGE,
  LOGIN_PAGE,
  REGISTER_PAGE,
} from './auth.constants'
import { Role } from './generated/prisma/enums'
import { getRequiredEnv } from './lib/env'

export const authConfig = {
  pages: {
    signIn: LOGIN_PAGE,
    newUser: REGISTER_PAGE,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isApiRoute = nextUrl.pathname.startsWith(API_ROUTES_PREFIX)
      const isAuthRoute = nextUrl.pathname.startsWith(AUTH_PAGES_PREFIX)

      // Allow API routes to perform their own check or token authentication
      if (isApiRoute) {
        return true
      }

      // Allow public access to the root landing page
      if (nextUrl.pathname === HOME_PAGE) {
        return true
      }

      // Redirect authenticated users away from login/register pages
      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL(CHATS_PAGE, nextUrl))
        }
        return true
      }

      // Protect all other dashboard routes
      return isLoggedIn
    },
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        ;(session.user as any).role = (user as any).role || Role.USER
      }
      return session
    },
  },
  providers: [
    Google({
      clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    }),
  ],
} satisfies NextAuthConfig
