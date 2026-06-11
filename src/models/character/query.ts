'use server'

import { db } from '@/lib/db'

export const getTrendingCharacters = async () => {
  const trendingCharacters = await db.character.findMany({
    where: {
      visibility: 'public',
    },
    orderBy: [
      { isFeatured: 'desc' },
      { isVerified: 'desc' },
      { usageCount: 'desc' },
    ],
    take: 6,
  })

  return trendingCharacters
}
