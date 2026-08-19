'use server'

import { Character } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export const findExistingUserChat = async (
  userId: string,
  characterId: string,
) => {
  try {
    const existingChat = await db.chat.findFirst({
      where: { userId, characterId },
      orderBy: { updatedAt: 'desc' },
    })
    return existingChat
  } catch (error) {
    console.log(error)
    return null
  }
}

export const initializeNewChat = async (
  character: Character,
  userId: string,
) => {
  try {
    const newChat = await db.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          userId,
          characterId: character.id,
          title: character.name,
          systemPromptSnapshot: character.systemPrompt,
        },
      })

      // Increment usageCount transactional
      await tx.character.update({
        where: { id: character.id },
        data: {
          usageCount: { increment: 1 },
        },
      })

      return chat
    })
    return newChat
  } catch (error) {
    console.log(error)
    return null
  }
}

export const getAllLoggedInUserChats = async (userId: string) => {
  try {
    const chats = await db.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        character: {
          select: {
            id: true,
            slug: true,
            name: true,
            avatarType: true,
            avatarValue: true,
            avatarColor: true,
            category: true,
            tone: true,
            description: true,
            usageCount: true,
            isVerified: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only retrieve the latest message for the sidebar preview
        },
      },
    })
    return { data: chats, success: true, error: null }
  } catch (error) {
    console.log(error)
    return { data: [], success: false, error: 'Error fetching your chats' }
  }
}
