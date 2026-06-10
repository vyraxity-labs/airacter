import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { authConfig } from './auth.config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { STARTING_TOKEN } from '@/lib/constants'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
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
          await bcrypt.compare(
            password,
            '$2a$12$Kb9R9b6W6v8u7t6s5r4e3u2i1o0p9a8s7d6f5g4h3j2k1l0z9x8c7',
          )
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
            type: 'credit_welcome',
          },
        })

        if (!existingTransaction) {
          await db.tokenTransaction.create({
            data: {
              userId: user.id,
              type: 'credit_welcome',
              direction: 'credit',
              amount: STARTING_TOKEN,
              metadata: {
                reason: 'Welcome bonus (OAuth)',
              },
            },
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
})
