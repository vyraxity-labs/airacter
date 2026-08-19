import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

const TokenBalanceWarning = ({ tokenBalance }: { tokenBalance: number }) => {
  return (
    <div
      className={cn(
        'px-6 py-2.5 flex items-center gap-2 border-b select-none text-xs font-semibold shrink-0 transition-colors z-10',
        tokenBalance < 1000
          ? 'bg-error/10 border-error/20 text-error animate-pulse'
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      )}
    >
      <AlertCircle size={14} className='shrink-0' />
      <span>
        {tokenBalance <= 0
          ? 'Your token balance is depleted (0 remaining). Chat is paused. Please top up to continue.'
          : tokenBalance < 1000
            ? 'Critically low token balance (' +
              tokenBalance.toLocaleString() +
              ' remaining). Chat will be paused soon. Please top up.'
            : 'Low token balance (' +
              tokenBalance.toLocaleString() +
              ' remaining).'}
      </span>
      <Link
        href='/upgrade'
        className={cn(
          'ml-auto underline hover:opacity-80 transition-opacity font-bold',
          tokenBalance < 1000
            ? 'text-error'
            : 'text-yellow-600 dark:text-yellow-400',
        )}
      >
        Buy Tokens
      </Link>
    </div>
  )
}

export default TokenBalanceWarning
