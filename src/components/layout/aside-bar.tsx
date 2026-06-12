'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { useAppContext } from '@/providers/store'

const AsideBar = ({ children }: { children: ReactNode }) => {
  const { asideIsOpen, setAsideIsOpen } = useAppContext()

  return (
    <aside
      className={cn(
        'w-screen md:w-[280px] h-screen fixed md:left-[72px] top-0 border-r border-border/40 backdrop-blur-sm z-50 theme-transition',
        asideIsOpen ? 'left-0' : 'left-[-2000px]',
      )}
      onClick={() => setAsideIsOpen(false)}
    >
      <div
        className='flex-col w-[280px] h-full bg-surface-low'
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </aside>
  )
}

export default AsideBar
