'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import DesktopSidebar from './layout/desktop-sidebar'
import { User } from '@/models/user/types'
import MobileBottomNav from './layout/mobile-bottom-nav'
import AsideBar from './layout/aside-bar'
import { Button } from './ui/button'
import { useAppContext } from '@/providers/store'
import { ChevronsRight } from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  user?: User
}

export function DashboardShell({
  children,
  sidebar,
  user,
}: DashboardShellProps) {
  const { asideIsOpen, setAsideIsOpen } = useAppContext()

  return (
    <div className='flex min-h-screen md:h-screen w-full overflow-hidden bg-background text-foreground font-sans theme-transition'>
      {/* 1. Left Nav Rail - Desktop (Fixed) */}
      <DesktopSidebar user={user} />

      {/* 2. Bottom Nav Bar - Mobile (Fixed) */}
      <MobileBottomNav />

      {/* 3. Middle Sidebar (Conditional, Fixed on Desktop, Toggles on mobile ) */}
      {sidebar && (
        <>
          <AsideBar>{sidebar}</AsideBar>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'fixed z-50 top-0 bg-surface-low rounded-tl-none rounded-bl-none cursor-pointer md:hidden',
              asideIsOpen ? 'left-[280px]' : 'left-0',
            )}
            onClick={() => setAsideIsOpen(!asideIsOpen)}
          >
            <ChevronsRight
              size={32}
              className={cn(asideIsOpen ? 'rotate-180' : 'rotate-0')}
            />
          </Button>
        </>
      )}

      {/* 4. Main Viewport */}
      <div
        className={cn(
          'grow flex flex-col min-h-screen md:h-screen md:overflow-hidden pb-16 md:pb-0',
          sidebar ? 'md:pl-[352px]' : 'md:pl-[72px]',
        )}
      >
        {children}
      </div>
    </div>
  )
}
