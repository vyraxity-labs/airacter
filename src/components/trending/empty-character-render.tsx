import { Compass } from 'lucide-react'
import Link from 'next/link'

const EmptyCharacterRender = () => {
  return (
    <div className='w-full rounded-2xl border border-dashed border-border/40 py-20 flex flex-col items-center justify-center text-center p-6 bg-surface-lowest/40 backdrop-blur-sm'>
      <Compass size={48} className='text-outline/60 mb-4 stroke-[1.5px]' />
      <h3 className='text-lg font-bold text-on-surface mb-1'>
        No personas found
      </h3>
      <p className='text-sm text-on-surface-variant max-w-sm mb-6'>
        We couldn't find any public personas matching your filters. Try checking
        your spelling or selecting another category.
      </p>
      <Link
        href='/explore'
        className='px-5 py-2 border border-border text-xs font-semibold rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all'
      >
        Clear Filters
      </Link>
    </div>
  )
}

export default EmptyCharacterRender
