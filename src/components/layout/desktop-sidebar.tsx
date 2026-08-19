'use client'

import { HelpCircle } from 'lucide-react'
import { getNavItems } from './data'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { User } from '@/models/user/types'
import ThemeUI from './theme-ui'
import UserAvatar from '../general/user-avatar'
import Logout from './logout'
import Logo from '../general/logo'

const DesktopSidebar = ({ user }: { user?: User }) => {
  const pathname = usePathname() || ''

  const navItems = getNavItems(pathname)

  return (
    <nav className='hidden md:flex fixed left-0 top-0 h-full w-[72px] z-50 flex-col items-center py-5 bg-surface-lowest border-r border-border/40 backdrop-blur-xl theme-transition'>
      {/* Brand Logo */}
      <div className='mb-8 flex items-center justify-center'>
        <Logo showName={false} href='/chats' />
      </div>

      {/* Navigation Actions */}
      <div className='flex flex-col gap-4 grow items-center'>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center scale-95 active:scale-90 hover:bg-surface-container',
                item.active
                  ? 'text-primary bg-primary-container/20 active-glow shadow-glow-primary border border-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
              title={item.label}
            >
              <Icon size={20} className={cn(item.active && 'stroke-[2.5px]')} />

              {/* Floating Tooltip */}
              <span className='absolute left-[76px] px-2.5 py-1.5 rounded-lg bg-surface-highest text-on-surface text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50 border border-border'>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Bottom actions */}
      <div className='flex flex-col gap-5 items-center mt-auto'>
        {/* Help */}
        <Link
          href='/help'
          className='text-on-surface-variant hover:text-on-surface p-2.5 hover:bg-surface-container rounded-xl transition-colors scale-95 active:scale-90'
          title='Help & Info'
        >
          <HelpCircle size={20} />
        </Link>

        {/* Theme Switcher Toggle */}
        <ThemeUI />

        {/* User Profile & Logout */}
        <div className='pt-4 border-t border-border/40 w-full flex flex-col gap-3 items-center'>
          <UserAvatar user={user} />
          <Logout />
        </div>
      </div>
    </nav>
  )
}

export default DesktopSidebar
