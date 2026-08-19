import { TrendingCharacter } from '@/models/character/types'
import { getInitials } from '@/models/user/helper'

interface CharacterVisualHeaderProps {
  character: TrendingCharacter
  imageError: boolean
  setImageError: (val: boolean) => void
}

const CharacterVisualHeader = ({
  character,
  imageError,
  setImageError,
}: CharacterVisualHeaderProps) => {
  if (
    character.avatarType === 'image' &&
    character.avatarValue &&
    !imageError
  ) {
    return (
      <img
        src={character.avatarValue}
        alt={character.name}
        className='w-full aspect-square object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-500'
        onError={() => setImageError(true)}
      />
    )
  }

  // fallback gradient with emoji/initials
  return (
    <div
      className='w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden'
      style={{
        background: `linear-gradient(135deg, ${character.avatarColor}20 0%, ${character.avatarColor}40 100%)`,
        border: `1px solid ${character.avatarColor}40`,
      }}
    >
      {/* Glow behind */}
      <div
        className='absolute w-24 h-24 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none'
        style={{ backgroundColor: character.avatarColor }}
      />

      {character.avatarType === 'emoji' ? (
        <span className='text-6xl select-none z-10 filter drop-shadow-md transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300'>
          {character.avatarValue}
        </span>
      ) : (
        <span
          className='text-4xl font-extrabold select-none z-10 tracking-wider font-sans group-hover:scale-105 transition-transform duration-300'
          style={{ color: character.avatarColor }}
        >
          {character.avatarType === 'initials'
            ? character.avatarValue
            : getInitials(character.name)}
        </span>
      )}
    </div>
  )
}

export default CharacterVisualHeader
