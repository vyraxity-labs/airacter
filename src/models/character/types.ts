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
