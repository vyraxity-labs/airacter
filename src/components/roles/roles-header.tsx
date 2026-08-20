'use client'

import { LibrarySearch } from '@/app/characters/my/library-search'
import { useTranslation } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

interface RolesHeaderProps {
  q: string
  tab: string
}

const RolesHeader = ({ q, tab }: RolesHeaderProps) => {
  const [searchIsExpanded, setSearchIsExpanded] = useState(false)
  const { t } = useTranslation('character')

  return (
    <header
      className={cn(
        'h-16 w-full glass border-b border-border/40 flex items-center justify-between px-8 z-10 select-none theme-transition',
        searchIsExpanded ? 'justify-end' : 'justify-between',
      )}
    >
      {!searchIsExpanded && (
        <div className='flex items-center gap-8'>
          <nav className='flex gap-6'>
            <Link
              href={`/characters/my?tab=all${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={cn(
                'pb-1 font-semibold text-sm transition-all border-b-2 hover:text-primary',
                tab === 'all'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent',
              )}
            >
              {t('tabs_header.all')}
            </Link>
            <Link
              href={`/characters/my?tab=created${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={cn(
                'pb-1 font-semibold text-sm transition-all border-b-2 hover:text-primary',
                tab === 'created'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent',
              )}
            >
              {t('tabs_header.created')}
            </Link>
            <Link
              href={`/characters/my?tab=saved${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={cn(
                'pb-1 font-semibold text-sm transition-all border-b-2 hover:text-primary',
                tab === 'saved'
                  ? 'text-primary border-primary font-bold'
                  : 'text-on-surface-variant border-transparent',
              )}
            >
              {t('tabs_header.saved_library')}
            </Link>
          </nav>
        </div>
      )}

      <div className='flex items-center gap-4'>
        <LibrarySearch
          searchIsExpanded={searchIsExpanded}
          setSearchIsExpanded={setSearchIsExpanded}
        />
      </div>
    </header>
  )
}

export default RolesHeader
