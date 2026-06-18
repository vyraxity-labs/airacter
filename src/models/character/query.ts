'use server'

import { Category } from '@/generated/prisma/enums'
import {
  CharacterOrderByWithRelationInput,
  CharacterWhereInput,
} from '@/generated/prisma/models'
import { db } from '@/lib/db'
import { TrendingCharacter } from './types'

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

export const getCharactersCreatedByUser = async (
  userId: string | undefined,
  q: string,
) => {
  const characters = await db.character.findMany({
    where: {
      createdBy: userId,
      OR: q
        ? [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: {
      creator: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return characters
}

export const getCharactersSavedByUser = async (
  userId: string | undefined,
  q: string,
) => {
  const saves = await db.characterSave.findMany({
    where: {
      userId: userId,
      character: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
    },
    include: {
      character: {
        include: {
          creator: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
    orderBy: { savedAt: 'desc' },
  })

  return saves.map((s) => s.character)
}

export const getCharactersByTabs = async (
  tab: string,
  userId: string | undefined,
  q: string,
) => {
  let characters: TrendingCharacter[] = []
  if (tab === 'created') {
    characters = await getCharactersCreatedByUser(userId, q)
  } else if (tab === 'saved') {
    characters = await getCharactersSavedByUser(userId, q)
  } else {
    // tab === "all"
    const [created, saves] = await Promise.all([
      getCharactersCreatedByUser(userId, q),
      getCharactersSavedByUser(userId, q),
    ])

    // Merge and deduplicate
    const createdIds = new Set(created.map((c) => c.id))
    characters = [...created, ...saves.filter((s) => !createdIds.has(s.id))]
  }

  return characters
}
