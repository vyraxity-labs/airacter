import { db } from '@/lib/db'

/**
 * Calculates a user's current token balance from their append-only ledger history.
 * Sums all credit transactions and subtracts all debit transactions.
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const transactions = await db.tokenTransaction.groupBy({
      by: ['direction'],
      where: { userId },
      _sum: { amount: true },
    })

    let totalCredits = 0
    let totalDebits = 0

    for (const tx of transactions) {
      if (tx.direction === 'credit') {
        totalCredits = tx._sum.amount || 0
      } else if (tx.direction === 'debit') {
        totalDebits = tx._sum.amount || 0
      }
    }

    return Math.max(0, totalCredits - totalDebits)
  } catch (error) {
    console.error('Failed to compute user token balance:', error)
    throw new Error('Failed to compute token balance')
  }
}
