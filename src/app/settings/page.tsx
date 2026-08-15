import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getUserTokenBalance } from '@/lib/tokens'
import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/settings/profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/login')
  }

  const user = session.user
  const userId = user.id as string

  // Retrieve user token balance and recent transactions
  const [balance, recentTransactions] = await Promise.all([
    getUserTokenBalance(userId),
    db.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        message: {
          select: {
            chat: {
              select: {
                title: true,
                character: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ])

  return (
    <ProfileClient
      user={{
        id: userId,
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
      }}
      initialBalance={balance}
      initialTransactions={recentTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        direction: tx.direction,
        amount: tx.amount,
        createdAt: tx.createdAt.toISOString(),
        chatName:
          tx.message?.chat?.title ||
          tx.message?.chat?.character?.name ||
          'AI Chat',
      }))}
    />
  )
}
