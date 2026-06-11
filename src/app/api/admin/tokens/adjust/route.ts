import { db } from '@/lib/db'
import { getUserTokenBalance } from '@/lib/tokens'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const adjustSchema = z.object({
  email: z.string().email(),
  amount: z
    .number()
    .int()
    .refine((val) => val !== 0, {
      message: 'Amount must be a non-zero integer',
    }),
  reason: z.string().min(2).max(250),
})

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admins only' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const result = adjustSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const { email, amount, reason } = result.data

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const direction = amount > 0 ? 'credit' : 'debit'
    const type = amount > 0 ? 'credit_admin' : 'debit_refund'
    const absoluteAmount = Math.abs(amount)

    if (direction === 'debit') {
      const currentBalance = await getUserTokenBalance(user.id)
      if (currentBalance < absoluteAmount) {
        return NextResponse.json(
          {
            error: `Insufficient balance. User only has ${currentBalance} tokens, but attempted to debit ${absoluteAmount}.`,
          },
          { status: 400 },
        )
      }
    }

    // Atomically create the token transaction record
    await db.tokenTransaction.create({
      data: {
        userId: user.id,
        type,
        direction,
        amount: absoluteAmount,
        metadata: {
          reason,
          adminUserId: userId,
          adminDescription: `Manual adjustment by administrator. Reason: ${reason}`,
        },
      },
    })

    // Recompute balance
    const newBalance = await getUserTokenBalance(user.id)

    return NextResponse.json({
      success: true,
      userName: user.name || email,
      newBalance,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to adjust token ledger' },
      { status: 500 },
    )
  }
}
