import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TrendingPaginationProps {
  page: number
  sort: string
  category: string
  totalPages: number
  q: string
}

const TrendingPagination = ({
  page,
  sort,
  category,
  totalPages,
  q,
}: TrendingPaginationProps) => {
  return (
    <div className='flex items-center justify-center gap-6 mt-12 pt-6 border-t border-border/10'>
      {page > 1 ? (
        <Link
          href={`/explore?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=${page - 1}`}
          className='flex items-center gap-1 text-sm font-semibold text-primary hover:underline'
        >
          <ChevronLeft size={16} />
          Previous
        </Link>
      ) : (
        <span className='flex items-center gap-1 text-sm font-semibold text-outline cursor-not-allowed'>
          <ChevronLeft size={16} />
          Previous
        </span>
      )}

      <div className='flex items-center gap-2'>
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1
          const isCurrent = pageNum === page
          const isNearCurrent = Math.abs(pageNum - page) <= 1
          const isBoundary = pageNum === 1 || pageNum === totalPages

          if (!isNearCurrent && !isBoundary) {
            if (pageNum === 2 && page > 3) {
              return (
                <span
                  key='ellipsis-start'
                  className='px-2 text-outline text-xs'
                >
                  ...
                </span>
              )
            }
            if (pageNum === totalPages - 1 && page < totalPages - 2) {
              return (
                <span key='ellipsis-end' className='px-2 text-outline text-xs'>
                  ...
                </span>
              )
            }
            return null
          }

          return (
            <Link
              key={pageNum}
              href={`/explore?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=${pageNum}`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                isCurrent
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'border-border/40 text-on-surface-variant hover:border-primary/30 hover:text-primary bg-surface-lowest'
              }`}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>

      {page < totalPages ? (
        <Link
          href={`/explore?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=${page + 1}`}
          className='flex items-center gap-1 text-sm font-semibold text-primary hover:underline'
        >
          Next
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className='flex items-center gap-1 text-sm font-semibold text-outline cursor-not-allowed'>
          Next
          <ChevronRight size={16} />
        </span>
      )}
    </div>
  )
}

export default TrendingPagination
