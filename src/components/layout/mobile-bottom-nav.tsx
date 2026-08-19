'use client'

import { usePathname } from 'next/navigation'
import { getNavItems } from './data'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Logout from './logout'
import ThemeUI from './theme-ui'

const MobileBottomNav = () => {
  const pathname = usePathname() || ''
  const navItems = getNavItems(pathname)

  return (
    <div className='md:hidden fixed bottom-0 left-0 w-full z-40 pointer-events-none'>
      <section className='w-full flex justify-end pr-4 pb-2'>
        <div className='bg-surface-low border border-border rounded-full shadow-lg pointer-events-auto'>
          {/* Theme Switcher - Mobile */}
          <ThemeUI />
        </div>
      </section>
      <nav className='h-16 bg-surface-lowest/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 theme-transition pointer-events-auto'>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200 flex flex-col items-center justify-center flex-1 max-w-20',
                item.active
                  ? 'text-primary bg-primary-container/10 border-t-2 border-primary rounded-none'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              <Icon size={18} />
              <span className='text-[10px] mt-1 font-medium leading-none'>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Profile / Logout - Mobile */}
        <Logout
          showLabel
          className='text-on-surface-variant p-2.5 flex flex-col items-center justify-center flex-1 max-w-20 cursor-pointer hover:bg-error/50 hover:text-on-error'
        />
      </nav>
    </div>
  )
}

export default MobileBottomNav
