import { db } from '@/lib/db'
import { Direction, TransactionType } from '@/generated/prisma/enums'
import { Prisma } from '@/generated/prisma/client'

/**
 * Calculates a user's current token balance from their active, unexpired TokenGrants.
 * Sums the remaining balance of all valid grants.
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const activeGrants = await db.tokenGrant.aggregate({
      where: {
        userId,
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      _sum: {
        remaining: true,
      },
    })

    return activeGrants._sum.remaining || 0
  } catch (error) {
    console.error('Failed to compute user token balance:', error)
    throw new Error('Failed to compute token balance')
  }
}

/**
 * Credits tokens to a user's account by inserting a TokenGrant and a TokenTransaction record in a transaction.
 */
export async function creditTokens(
  userId: string,
  type: 'welcome' | 'subscription' | 'purchase' | 'admin',
  amount: number,
  expiresAt?: Date | null,
  metadata?: any,
  prismaClient?: Prisma.TransactionClient,
): Promise<void> {
  try {
    // Map internal type to TransactionType enum
    let transactionType: TransactionType
    switch (type) {
      case 'welcome':
        transactionType = TransactionType.credit_welcome
        break
      case 'subscription':
      case 'purchase':
        transactionType = TransactionType.credit_purchase
        break
      case 'admin':
        transactionType = TransactionType.credit_admin
        break
      default:
        transactionType = TransactionType.credit_admin
    }

    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Create the TokenGrant
      await tx.tokenGrant.create({
        data: {
          userId,
          type,
          amount,
          remaining: amount,
          expiresAt: expiresAt || null,
        },
      })

      // 2. Create the TokenTransaction
      await tx.tokenTransaction.create({
        data: {
          userId,
          type: transactionType,
          direction: Direction.credit,
          amount,
          metadata: metadata || {},
        },
      })
    }

    if (prismaClient) {
      await execute(prismaClient)
    } else {
      await db.$transaction(execute)
    }
  } catch (error) {
    console.error('Failed to credit tokens:', error)
    throw new Error('Failed to credit tokens')
  }
}

/**
 * Debits tokens from a user's account by drawing down their active, unexpired TokenGrants in FIFO order.
 * Runs inside a concurrency-safe database transaction with row-level locking (FOR UPDATE).
 */
export async function debitTokens(
  userId: string,
  amount: number,
  referenceId?: string | null,
  metadata?: any,
  type: TransactionType = TransactionType.debit_message,
  prismaClient?: Prisma.TransactionClient,
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Debit amount must be greater than zero')
  }

  try {
    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Query all active, unexpired grants for this user with FOR UPDATE row-level locking.
      // This prevents concurrent requests from double-spending the same remaining tokens.
      const grants = await tx.$queryRaw<
        Array<{ id: string; remaining: number; expiresAt: Date | null }>
      >`
        SELECT id, remaining, "expiresAt"
        FROM "TokenGrant"
        WHERE "userId" = ${userId}
          AND remaining > 0
          AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
        ORDER BY "expiresAt" ASC NULLS LAST, "createdAt" ASC
        FOR UPDATE
      `

      // 2. Sum available remaining tokens
      const totalAvailable = grants.reduce(
        (sum, g) => sum + Number(g.remaining),
        0,
      )
      if (totalAvailable < amount) {
        throw new Error('Insufficient token balance')
      }

      // 3. Subtract tokens from grants in FIFO order
      let amountLeftToDebit = amount
      for (const grant of grants) {
        if (amountLeftToDebit <= 0) break

        const remainingVal = Number(grant.remaining)
        const debitFromThisGrant = Math.min(remainingVal, amountLeftToDebit)
        const newRemaining = remainingVal - debitFromThisGrant

        await tx.tokenGrant.update({
          where: { id: grant.id },
          data: { remaining: newRemaining },
        })

        amountLeftToDebit -= debitFromThisGrant
      }

      // 4. Create the TokenTransaction row as the audit log
      await tx.tokenTransaction.create({
        data: {
          userId,
          type,
          direction: Direction.debit,
          amount,
          referenceId: referenceId || null,
          metadata: metadata || {},
        },
      })
    }

    if (prismaClient) {
      await execute(prismaClient)
    } else {
      await db.$transaction(execute)
    }
  } catch (error: any) {
    // If it's our own custom error, rethrow it directly
    if (
      error.message === 'Insufficient token balance' ||
      error.message === 'Debit amount must be greater than zero'
    ) {
      throw error
    }
    console.error('Failed to debit tokens:', error)
    throw new Error('Failed to debit tokens')
  }
}
