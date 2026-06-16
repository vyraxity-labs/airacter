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

export const findCharacterBySlug = async (slug: string) => {
  try {
    const character = await db.character.findUnique({
      where: { slug },
    })
    return character
  } catch (error) {
    console.log(error)
    return null
  }
}

export const incrementCharacterUsage = async (characterId: string) => {
  try {
    const character = await db.character.update({
      where: { id: characterId },
      data: {
        usageCount: { increment: 1 },
      },
    })
    return character
  } catch (error) {
    console.log(error)
    return null
  }
}
