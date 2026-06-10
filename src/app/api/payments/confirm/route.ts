import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const confirmSchema = z.object({
  packId: z.enum(['lite', 'standard', 'pro']),
})

const PACKAGE_TOKENS = {
  lite: 50000,
  standard: 150000,
  pro: 400000,
}

const PACKAGE_PRICES = {
  lite: '$4.99',
  standard: '$9.99',
  pro: '$19.99',
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = confirmSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid package selection' },
        { status: 400 },
      )
    }

    const { packId } = result.data
    const amount = PACKAGE_TOKENS[packId]
    const price = PACKAGE_PRICES[packId]

    // Atomically credit user tokens
    const transaction = await db.tokenTransaction.create({
      data: {
        userId,
        type: 'credit_purchase',
        direction: 'credit',
        amount,
        metadata: {
          packId,
          price,
          description: `Token pack purchase: ${packId.toUpperCase()}`,
        },
      },
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
    })
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 },
    )
  }
}
