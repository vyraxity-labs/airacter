'use client'

import { Character } from '@/generated/prisma/client'
import { getInitials } from '@/models/character/helper'
import { useState } from 'react'

const ChatSidebarAvatar = ({ character }: { character: Character }) => {
  const [imageError, setImageError] = useState(false)

  if (
    character.avatarType === 'image' &&
    character.avatarValue &&
    !imageError
  ) {
    return (
      <img
        src={character.avatarValue}
        alt={character.name}
        className='w-9 h-9 rounded-xl object-cover shadow-inner shrink-0'
        onError={() => setImageError(true)}
      />
    )
  }

  const fallbackText =
    character.avatarType === 'emoji'
      ? character.avatarValue
      : getInitials(character.name)

  return (
    <div
      className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold font-sans shadow-inner select-none'
      style={{
        background: `linear-gradient(135deg, ${character.avatarColor}15 0%, ${character.avatarColor}30 100%)`,
        border: `1px solid ${character.avatarColor}20`,
        color: character.avatarColor,
      }}
    >
      <span className='scale-90'>{fallbackText}</span>
    </div>
  )
}

export default ChatSidebarAvatar
