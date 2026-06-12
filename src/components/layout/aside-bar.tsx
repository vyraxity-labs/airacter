'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { useAppContext } from '@/providers/store'

const AsideBar = ({ children }: { children: ReactNode }) => {
  const { asideIsOpen, setAsideIsOpen } = useAppContext()

  return (
    <aside
      className={cn(
        'w-screen md:w-[280px] h-screen fixed left-0 md:left-[72px] top-0 border-r border-border/40 backdrop-blur-sm bg-background/40 z-50 transition-all duration-300',
        asideIsOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
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
