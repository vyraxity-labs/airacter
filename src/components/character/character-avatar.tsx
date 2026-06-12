import { getInitials } from '@/models/character/helper'
import { Character } from '@/models/character/types'
import Image from 'next/image'

const CharacterAvatar = ({ char }: { char: Character }) => {
  if (char.avatarType === 'image' && char.avatarValue) {
    return (
      <Image
        src={char.avatarValue}
        alt={char.name}
        width={48}
        height={48}
        className='w-12 h-12 rounded-xl object-cover border border-border/10'
      />
    )
  }

  const initials = getInitials(char.name)

  return (
    <div
      className='w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white border border-border/10 relative'
      style={{ backgroundColor: char.avatarColor }}
    >
      {char.avatarType === 'emoji' ? char.avatarValue : initials}
    </div>
  )
}

export default CharacterAvatar
