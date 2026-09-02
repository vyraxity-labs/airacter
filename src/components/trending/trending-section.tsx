'use client'

import { TrendingCharacter } from '@/models/character/types'
import { Compass } from 'lucide-react'
import TrendingCard from './trending-card'
import { useTranslation } from '@/lib/i18n/client'

const TrendingSection = ({ trending }: { trending: TrendingCharacter[] }) => {
  const { t } = useTranslation('character')

  return (
    <section className='mb-12'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2'>
          <Compass size={22} className='text-primary animate-pulse' />
          {t('main.explore.trending.title')}
        </h2>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {trending.map((char) => (
          <TrendingCard key={char.id} char={char} />
        ))}
      </div>
    </section>
  )
}

export default TrendingSection
