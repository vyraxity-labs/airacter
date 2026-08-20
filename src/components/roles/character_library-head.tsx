'use client'

import { useTranslation } from '@/lib/i18n/client'

const CharacterLibraryHead = () => {
  const { t } = useTranslation('character')

  return (
    <div className='flex items-center justify-between mb-6'>
      <h3 className='text-xl font-bold text-on-background select-none'>
        {t('main.empty_filter.head')}
      </h3>
    </div>
  )
}

export default CharacterLibraryHead
