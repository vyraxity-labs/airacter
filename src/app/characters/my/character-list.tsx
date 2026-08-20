'use client'

import { CharacterCard } from '@/components/character/character-card'
import { useTranslation } from '@/lib/i18n/client'
import { TrendingCharacter } from '@/models/character/types'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface CharacterListProps {
  characters: TrendingCharacter[]
  savedIds: Set<string>
  userId: string | undefined
}

const CharacterList = ({
  characters,
  savedIds,
  userId,
}: CharacterListProps) => {
  const { t } = useTranslation('character')

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
      {characters.map((char) => (
        <CharacterCard
          key={char.id}
          character={char}
          isSaved={savedIds.has(char.id)}
          currentUserId={userId}
          variant='library'
        />
      ))}

      {/* Always show Add Persona dashed card at the end of the list */}
      <Link
        href='/characters/new'
        className='border-2 border-dashed border-border/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer text-center bg-surface-lowest/20 backdrop-blur-sm min-h-55 select-none'
      >
        <div className='w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform'>
          <Plus className='text-primary' size={24} />
        </div>
        <span className='font-bold text-sm text-on-surface-variant group-hover:text-primary'>
          {t('main.character_list.create')}
        </span>
        <p className='text-xs text-outline max-w-50 mt-1'>
          {t('main.character_list.create_desc')}
        </p>
      </Link>
    </div>
  )
}

export default CharacterList
