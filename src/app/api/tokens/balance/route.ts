import { NextResponse } from 'next/server'
import { getUserTokenBalance } from '@/lib/tokens'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const balance = await getUserTokenBalance(userId)
    return NextResponse.json({ balance })
  } catch (error: any) {
    console.error('Failed to retrieve token balance:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve token balance' },
      { status: 500 },
    )
  }
}
