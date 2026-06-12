export interface Character {
  id: string
  name: string
  slug: string
  description: string
  avatarType: 'emoji' | 'initials' | 'image'
  avatarValue: string
  avatarColor: string
  category: string
  tone: string[]
  isVerified: boolean
  usageCount: number
}
