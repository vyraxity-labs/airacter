'use client'

import { useTranslation } from '@/lib/i18n/client'
import { ExploreSort } from './explore-sort'

interface ExploreGalleryHeaderProps {
  isFiltered: boolean
  total: number
}

export function ExploreGalleryHeader({
  isFiltered,
  total,
}: ExploreGalleryHeaderProps) {
  const { t } = useTranslation('character')

  return (
    <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-8 border-b border-border/10 pb-4'>
      <div className='flex items-center gap-3'>
        <h2 className='text-xl font-bold text-on-surface'>
          {isFiltered
            ? t('main.explore.gallery_header.search_results')
            : t('main.explore.gallery_header.public_personas')}
        </h2>
        <span className='text-xs px-2.5 py-1 bg-surface-container border border-border/20 text-on-surface-variant font-semibold rounded-full'>
          {total}{' '}
          {total === 1
            ? t('main.explore.gallery_header.persona_count_one')
            : t('main.explore.gallery_header.persona_count_other')}
        </span>
      </div>

      <ExploreSort />
    </div>
  )
}
