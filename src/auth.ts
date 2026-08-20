import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { authConfig } from './auth.config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { STARTING_TOKEN } from '@/lib/constants'
import { DUMMY_PASSWORD_HASH } from './auth.constants'
import { TransactionType } from '@/generated/prisma/enums'
import { creditTokens } from '@/lib/tokens'
import crypto from 'crypto'
import { encode } from 'next-auth/jwt'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data

        // Fetch user from the database
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          // Perform a dummy comparison to mitigate timing attacks / email enumeration
          await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
          return null
        }

        // Validate password hash
        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }
        }

        return null
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return
      try {
        const existingTransaction = await db.tokenTransaction.findFirst({
          where: {
            userId: user.id,
            type: TransactionType.credit_welcome,
          },
        })

        if (!existingTransaction) {
          await creditTokens(user.id, 'welcome', STARTING_TOKEN, null, {
            reason: 'Welcome bonus (OAuth)',
          })
          console.log(
            `[NextAuth] Credited OAuth starter tokens to user ${user.id} (${user.email})`,
          )
        }
      } catch (err) {
        console.error(
          `[NextAuth] Failed to credit welcome tokens for user ${user.id}:`,
          err,
        )
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (account?.provider === 'credentials' && user && user.id) {
        // Generate a random session token
        const sessionToken = crypto.randomUUID()
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        // Manually write session to database
        await db.session.create({
          data: {
            sessionToken,
            userId: user.id,
            expires,
          },
        })
        token.sessionId = sessionToken
      }
      return token
    },
  },
  jwt: {
    async encode(params) {
      if (params.token?.sessionId) {
        return params.token.sessionId as string
      }
      return encode(params)
    },
  },
})
