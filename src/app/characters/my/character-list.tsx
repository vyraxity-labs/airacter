import { CharacterCard } from '@/components/character/character-card'
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
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
      {characters.map((char) => (
        <CharacterCard
          key={char.id}
          character={char as any}
          isSaved={savedIds.has(char.id)}
          currentUserId={userId}
          variant='library'
        />
      ))}

      {/* Always show Add Persona dashed card at the end of the list */}
      <Link
        href='/characters/new'
        className='border-2 border-dashed border-border/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer text-center bg-surface-lowest/20 backdrop-blur-sm min-h-[220px] select-none'
      >
        <div className='w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform'>
          <Plus className='text-primary' size={24} />
        </div>
        <span className='font-bold text-sm text-on-surface-variant group-hover:text-primary'>
          Create New Persona
        </span>
        <p className='text-xs text-outline max-w-[200px] mt-1'>
          Click here to forge a new AI persona from scratch.
        </p>
      </Link>
    </div>
  )
}

export default CharacterList
