'use client'

import { TrendingCharacter } from '@/models/character/types'
import { getInitials } from '@/models/user/helper'
import { Edit, MessageSquare } from 'lucide-react'
import { MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

interface LibraryCharacterRenderProps {
  character: TrendingCharacter
  imageError: boolean
  setImageError: (error: boolean) => void
  isCreator: boolean
  handleChatRedirect: (e: MouseEvent) => void
}

const LibraryCharacterRender = ({
  character,
  imageError,
  setImageError,
  handleChatRedirect,
  isCreator,
}: LibraryCharacterRenderProps) => {
  const router = useRouter()

  const handleEditRedirect = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/characters/${character.id}/edit`)
  }

  return (
    <div className='glass-card rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(137,206,255,0.2)] transition-all duration-300 group'>
      <div className='flex justify-between items-start'>
        {/* Small Avatar icon container */}
        {character.avatarType === 'image' &&
        character.avatarValue &&
        !imageError ? (
          <img
            src={character.avatarValue}
            alt={character.name}
            className='w-16 h-16 rounded-2xl object-cover shadow-inner'
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className='w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner relative overflow-hidden'
            style={{
              background: `linear-gradient(135deg, ${character.avatarColor}20 0%, ${character.avatarColor}40 100%)`,
              border: `1px solid ${character.avatarColor}30`,
            }}
          >
            <span className='z-10'>
              {character.avatarType === 'image'
                ? getInitials(character.name)
                : character.avatarValue}
            </span>
          </div>
        )}

        <span className='bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider'>
          {character.category}
        </span>
      </div>

      <div className='flex-1'>
        <h4 className='font-title-md text-title-md text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors'>
          {character.name}
        </h4>
        <p className='text-on-surface-variant text-sm line-clamp-2 leading-relaxed'>
          {character.description}
        </p>
      </div>

      <div className='mt-auto pt-4 flex gap-3 border-t border-border/10'>
        <button
          onClick={handleChatRedirect}
          className='flex-1 bg-primary/20 text-primary hover:bg-primary/30 font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-sm'
        >
          <MessageSquare size={14} />
          Use
        </button>
        {isCreator && (
          <button
            onClick={handleEditRedirect}
            className='p-2.5 border border-border/40 text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-all cursor-pointer'
            title='Edit character'
          >
            <Edit size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default LibraryCharacterRender
