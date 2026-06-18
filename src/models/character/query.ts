'use server'

import { Category } from '@/generated/prisma/enums'
import {
  CharacterOrderByWithRelationInput,
  CharacterWhereInput,
} from '@/generated/prisma/models'
import { db } from '@/lib/db'

export const getTrendingCharacters = async (take: number = 6) => {
  const trendingCharacters = await db.character.findMany({
    where: {
      visibility: 'public',
    },
    orderBy: [
      { isFeatured: 'desc' },
      { isVerified: 'desc' },
      { usageCount: 'desc' },
    ],
    take,
    include: {
      creator: {
        select: { id: true, name: true, image: true },
      },
    },
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

export const getFilterableCharacters = async (
  where: CharacterWhereInput,
  orderBy: CharacterOrderByWithRelationInput,
  skip: number,
  take: number,
) => {
  return db.character.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      creator: {
        select: { id: true, name: true, image: true },
      },
    },
  })
}

export const getIdOfCharactersSavedByUser = async (
  userId: string | undefined,
) => {
  if (!userId) return []
  return db.characterSave.findMany({
    where: { userId },
    select: { characterId: true },
  })
}

export const runExplorePageQuery = async (
  sort: string,
  category: string,
  skip: number,
  limit: number,
  page: number,
  userId: string | undefined,
  q: string,
) => {
  // Build prisma query filters
  const where: CharacterWhereInput = {
    visibility: 'public',
  }

  if (
    category &&
    category !== 'all' &&
    Object.values(Category).includes(category as Category)
  ) {
    where.category = category as Category
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  // Build ordering
  const orderBy: CharacterOrderByWithRelationInput = {}
  if (sort === 'new') {
    orderBy.createdAt = 'desc'
  } else {
    orderBy.usageCount = 'desc'
  }

  const [characters, total, saves, trending] = await Promise.all([
    getFilterableCharacters(where, orderBy, skip, limit),
    db.character.count({ where }),
    getIdOfCharactersSavedByUser(userId),
    page === 1 && !q && category === 'all'
      ? getTrendingCharacters(3)
      : Promise.resolve([]),
  ])

  return { characters, total, saves, trending }
}
