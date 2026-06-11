'use client'

import { Character } from '@/models/character/types'
import { User } from '@/models/user/types'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CharacterAvatar from '../character/character-avatar'

const FeaturedCharacters = ({
  featuredCharacters,
  user,
}: {
  featuredCharacters: Character[]
  user: User | null
}) => {
  const router = useRouter()

  const handleCharacterClick = (slug: string) => {
    if (user) {
      router.push(`/chats?character=${slug}`)
    } else {
      const callbackUrl = encodeURIComponent(`/chats?character=${slug}`)
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
    }
  }

  return (
    <section className='max-w-6xl mx-auto px-8 py-10 space-y-6'>
      <div className='flex justify-between items-end'>
        <div>
          <h2 className='text-xl font-bold text-on-surface'>
            Trending Personas
          </h2>
          <p className='text-xs text-on-surface-variant mt-0.5'>
            Click any character below to initiate conversation.
          </p>
        </div>
        <Link
          href='/explore'
          className='text-xs text-primary font-bold hover:underline flex items-center gap-1'
        >
          View All Explore Gallery
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {featuredCharacters.map((char) => (
          <div
            key={char.id}
            onClick={() => handleCharacterClick(char.slug)}
            className='glass-panel rounded-3xl p-5 hover:border-primary/20 transition-all cursor-pointer flex flex-col justify-between h-44 hover:shadow-lg hover:-translate-y-0.5 select-none'
          >
            <div className='flex gap-4'>
              <CharacterAvatar char={char} />
              <div className='space-y-1 flex-1'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-sm font-bold text-on-surface line-clamp-1'>
                    {char.name}
                  </h4>
                  {char.isVerified && (
                    <span className='text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider'>
                      Verified
                    </span>
                  )}
                </div>
                <span className='text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded uppercase font-bold tracking-wider w-fit block'>
                  {char.category}
                </span>
                <p className='text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1'>
                  {char.description}
                </p>
              </div>
            </div>

            <div className='pt-3 border-t border-border/10 flex justify-between items-center text-[10px] text-on-surface-variant'>
              <span>
                Tones: <strong>{char.tone.slice(0, 2).join(', ')}</strong>
              </span>
              <span>
                Chats: <strong>{char.usageCount.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturedCharacters
