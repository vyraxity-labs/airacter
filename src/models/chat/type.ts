import { Character } from '@/generated/prisma/client'

/**
 * The subset of Character fields selected in `getAllLoggedInUserChats`.
 * Must stay in sync with the `select` block in models/chat/query.ts.
 */
export type ChatCharacter = Pick<
  Character,
  | 'id'
  | 'slug'
  | 'name'
  | 'avatarType'
  | 'avatarValue'
  | 'avatarColor'
  | 'category'
  | 'tone'
  | 'description'
  | 'usageCount'
  | 'isVerified'
>

export interface Chat {
  id: string
  title: string | null
  userId: string
  characterId: string
  updatedAt: Date | string
  character: ChatCharacter
  messages: Array<{
    role: string
    content: string
    createdAt: Date | string
  }>
}
