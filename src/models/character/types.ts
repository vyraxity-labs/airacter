import { AvatarType, Category, Visibility } from '@/generated/prisma/enums'

export interface Character {
  id: string
  slug: string
  name: string
  description: string
  systemPrompt: string
  avatarType: AvatarType
  avatarValue: string
  avatarColor: string
  tone: string[]
  category: Category
  visibility: Visibility
  isVerified: boolean
  isFeatured: boolean
  usageCount: number
  saveCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type FeaturedCharacter = Omit<
  Character,
  | 'systemPrompt'
  | 'createdBy'
  | 'updatedAt'
  | 'createdAt'
  | 'saveCount'
  | 'isFeatured'
  | 'visibility'
>

export type TrendingCharacter = {
  creator: {
    id: string
    name: string | null
    image: string | null
  }
} & {
  slug: string
  id: string
  avatarType: AvatarType
  avatarValue: string
  name: string
  avatarColor: string
  category: Category
  description: string
  systemPrompt: string
  tone: string[]
  visibility: Visibility
  isVerified: boolean
  isFeatured: boolean
  usageCount: number
  saveCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
