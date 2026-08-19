'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Plus, Check, MessageSquare, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendingCharacter } from '@/models/character/types'
import CharacterVisualHeader from './character-visual-header'
import LibraryCharacterRender from './library-character-render'

interface CharacterCardProps {
  character: TrendingCharacter
  isSaved?: boolean
  currentUserId?: string
  variant?: 'explore' | 'library'
}

export function CharacterCard({
  character,
  isSaved = false,
  currentUserId,
  variant = 'explore',
}: CharacterCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localSaved, setLocalSaved] = useState(isSaved)
  const [localSaveCount, setLocalSaveCount] = useState(character.saveCount)
  const [imageError, setImageError] = useState(false)

  const isCreator = currentUserId === character.createdBy

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const newSavedState = !localSaved
    setLocalSaved(newSavedState)
    setLocalSaveCount((prev) =>
      newSavedState ? prev + 1 : Math.max(0, prev - 1),
    )

    try {
      const response = await fetch(`/api/characters/${character.id}/save`, {
        method: newSavedState ? 'POST' : 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle save state')
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error(err)
      // Revert state if failed
      setLocalSaved(isSaved)
      setLocalSaveCount(character.saveCount)
    }
  }

  const handleChatRedirect = () => {
    // Navigate to chat for this character
    router.push(`/chats?character=${character.slug}`)
  }

  if (variant === 'library') {
    // Render My Characters Library Card style
    return (
      <LibraryCharacterRender
        character={character}
        imageError={imageError}
        setImageError={setImageError}
        handleChatRedirect={handleChatRedirect}
        isCreator={isCreator}
      />
    )
  }

  // Render Explore Card style
  return (
    <div className='glass-panel p-5 rounded-[24px] flex flex-col gap-4 hover:border-primary/40 transition-all duration-300 group hover:-translate-y-1'>
      <div className='relative'>
        <CharacterVisualHeader
          character={character}
          imageError={imageError}
          setImageError={setImageError}
        />
        <button
          onClick={handleSaveToggle}
          disabled={isPending}
          className={cn(
            'absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer border',
            localSaved
              ? 'bg-primary/80 border-primary/20 text-white shadow-sm'
              : 'bg-background/40 border-white/10 text-white hover:text-primary hover:bg-background/60',
          )}
          title={localSaved ? 'Remove from Library' : 'Save to Library'}
        >
          <Bookmark size={18} className={cn(localSaved && 'fill-current')} />
        </button>
      </div>

      <div className='flex flex-col flex-1'>
        <div className='flex items-center justify-between mb-1.5'>
          <h4 className='font-title-md text-title-md font-bold text-on-surface group-hover:text-primary transition-colors truncate max-w-[70%]'>
            {character.name}
          </h4>
          <span className='text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider'>
            {character.category}
          </span>
        </div>

        <p className='text-on-surface-variant text-xs mb-3 line-clamp-2 leading-normal flex-1'>
          {character.description}
        </p>

        <div className='flex items-center justify-between mt-auto pt-3 border-t border-border/10'>
          <span className='text-[11px] text-outline font-medium'>
            by @{character.creator?.name || 'creator'}
          </span>
          <span className='text-[11px] text-outline'>
            {localSaveCount} saves
          </span>
        </div>

        <div className='mt-3 flex gap-2'>
          <button
            onClick={handleSaveToggle}
            disabled={isPending}
            className={cn(
              'flex-1 py-2.5 flex items-center justify-center gap-1.5 border rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer',
              localSaved
                ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                : 'border-primary/30 text-primary hover:bg-primary/5',
            )}
          >
            {localSaved ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              <>
                <Plus size={14} />
                Save Library
              </>
            )}
          </button>

          <button
            onClick={handleChatRedirect}
            className='px-3.5 py-2.5 bg-primary hover:bg-primary-container text-primary-foreground font-semibold rounded-xl text-sm flex items-center justify-center cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-[0.98]'
          >
            <MessageSquare size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
