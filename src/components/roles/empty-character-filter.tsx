'use client'

import { useTranslation } from '@/lib/i18n/client'
import { Compass, Plus } from 'lucide-react'
import Link from 'next/link'

const EmptyCharacterFilter = () => {
  const { t } = useTranslation('character')

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
      {/* Create Character trigger block card */}
      <Link
        href='/characters/new'
        className='border-2 border-dashed border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer text-center bg-surface-lowest/20 backdrop-blur-sm min-h-55 select-none'
      >
        <div className='w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform'>
          <Plus className='text-primary' size={24} />
        </div>
        <span className='font-bold text-sm text-on-surface-variant group-hover:text-primary'>
          {t('main.empty_filter.create')}
        </span>
        <p className='text-xs text-outline max-w-xs mt-1'>
          {t('main.empty_filter.create_desc')}
        </p>
      </Link>

      <div className='border border-border/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-surface-lowest/20 backdrop-blur-sm min-h-55 select-none md:col-span-1 xl:col-span-2'>
        <Compass
          size={36}
          className='text-outline stroke-[1.5px] animate-pulse'
        />
        <span className='font-bold text-sm text-on-surface-variant'>
          {t('main.empty_filter.no_match')}
        </span>
        <p className='text-xs text-outline max-w-xs mt-1'>
          {t('main.empty_filter.no_match_desc')}
        </p>
        <Link
          href='/explore'
          className='mt-2 text-xs font-semibold px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20'
        >
          {t('main.empty_filter.go')}
        </Link>
      </div>
    </div>
  )
}

export default EmptyCharacterFilter
