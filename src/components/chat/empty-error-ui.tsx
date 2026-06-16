'use client'

import { Loader2, MessageSquare } from 'lucide-react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

const EmptyErrorUI = ({ errorMessage }: { errorMessage?: string }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRetry = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  if (errorMessage) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <p className='text-xs font-semibold text-error mt-4 text-center'>
          {errorMessage}
        </p>

        <Button
          variant='ghost'
          size='sm'
          onClick={handleRetry}
          disabled={isPending}
          className='text-xs mt-2 cursor-pointer'
        >
          Retry
          {isPending && <Loader2 className='animate-spin' size={12} />}
        </Button>
      </div>
    )
  }
  return (
    <div className='py-12 px-4 text-center'>
      <MessageSquare
        className='mx-auto text-outline/40 mb-3 stroke-[1.5px]'
        size={32}
      />
      <p className='text-xs font-semibold text-on-surface-variant'>
        No active conversations
      </p>
      <p className='text-[10px] text-outline mt-1 leading-relaxed'>
        Explore characters and start talking to one to begin!
      </p>
    </div>
  )
}

export default EmptyErrorUI
