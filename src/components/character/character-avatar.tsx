import { cn } from '@/lib/utils'
import { getInitials } from '@/models/character/helper'
import { Character } from '@/models/character/types'
import Image from 'next/image'

interface CharacterAvatarProps {
  char: Omit<
    Character,
    | 'visibility'
    | 'systemPrompt'
    | 'isFeatured'
    | 'usageCount'
    | 'saveCount'
    | 'createdBy'
    | 'createdAt'
    | 'updatedAt'
  >
  size?: 'small' | 'medium'
}

const CharacterAvatar = ({ char, size = 'medium' }: CharacterAvatarProps) => {
  const baseSize = size === 'small' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'

  if (char.avatarType === 'image' && char.avatarValue) {
    return (
      <Image
        src={char.avatarValue}
        alt={char.name}
        width={48}
        height={48}
        className={cn(
          'rounded-xl object-cover border border-border/10',
          baseSize,
        )}
      />
    )
  }

  const initials = getInitials(char.name)

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center font-bold text-white border border-border/10 relative',
        baseSize,
      )}
      style={{ backgroundColor: char.avatarColor }}
    >
      {char.avatarType === 'emoji' ? char.avatarValue : initials}
    </div>
  )
}

export default CharacterAvatar
