'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import useMediaQuery from '@/hooks/use-media-query'
import { breakpoints } from '@/lib/break-points'

interface LibrarySearchProps {
  searchIsExpanded: boolean
  setSearchIsExpanded: (val: boolean) => void
}

export function LibrarySearch({
  searchIsExpanded,
  setSearchIsExpanded,
}: LibrarySearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const lg = useMediaQuery(breakpoints.lg)

  const currentQ = searchParams?.get('q') || ''
  const [searchVal, setSearchVal] = useState(currentQ)

  useEffect(() => {
    setSearchVal(currentQ)
  }, [currentQ])

  useEffect(() => {
    if (searchIsExpanded) {
      inputRef.current?.focus()
    }
  }, [searchIsExpanded])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchVal !== currentQ) {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (searchVal) {
          params.set('q', searchVal)
        } else {
          params.delete('q')
        }
        startTransition(() => {
          router.push(`/characters/my?${params.toString()}`)
        })
      }
    }, 450)

    return () => clearTimeout(delayDebounce)
  }, [searchVal, currentQ, searchParams, router])

  return (
    <div className='relative group select-none'>
      <input
        ref={inputRef}
        type='text'
        value={searchVal}
        onChange={(e) => setSearchVal(e.target.value)}
        placeholder='Search characters...'
        className={cn(
          'bg-surface-container border border-border/10 rounded-full pl-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-on-surface placeholder:text-outline',
          searchIsExpanded ? 'w-64 pr-4' : 'w-0 pr-1 lg:w-64 lg:pr-4',
        )}
        onBlur={() => setSearchIsExpanded(false)}
      />
      <Search
        size={16}
        className='absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors'
        onClick={() => !lg && setSearchIsExpanded(true)}
      />
      {searchIsExpanded && isPending && (
        <Loader2
          size={16}
          className='animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors'
        />
      )}
    </div>
  )
}
