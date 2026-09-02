'use client'

import { useThemeStore } from '@/hooks/use-theme-store'
import { User } from '@/models/user/types'
import { ArrowRight, Moon, Sun, UserIcon } from 'lucide-react'
import Link from 'next/link'
import Logo from '../general/logo'
import { useTranslation } from '@/lib/i18n/client'

const LandingHeader = ({ user }: { user: User | null }) => {
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation('landing')

  return (
    <header className='sticky top-0 z-50 h-16 w-full flex justify-between items-center px-8 bg-surface/70 border-b border-border/20 backdrop-blur-md'>
      <Logo />

      {/* Navigation Links */}
      <nav className='hidden md:flex items-center gap-6 text-xs font-bold text-on-surface-variant'>
        <Link href='/explore' className='hover:text-primary transition-colors'>
          {t('header.links.explore')}
        </Link>
        {user && (
          <>
            <Link
              href='/chats'
              className='hover:text-primary transition-colors'
            >
              {t('header.links.chats')}
            </Link>
            <Link
              href='/characters/my'
              className='hover:text-primary transition-colors'
            >
              {t('header.links.my_library')}
            </Link>
            <Link
              href='/settings'
              className='hover:text-primary transition-colors'
            >
              {t('header.links.settings')}
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href='/admin'
                className='hover:text-primary transition-colors text-secondary'
              >
                {t('header.links.admin_console')}
              </Link>
            )}
          </>
        )}
      </nav>

      {/* Action button & theme switcher */}
      <div className='flex items-center gap-3'>
        <button
          onClick={toggleTheme}
          className='p-2 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-border/25 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer'
          title={
            theme === 'dark'
              ? t('header.theme.switch_to_light')
              : t('header.theme.switch_to_dark')
          }
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {user ? (
          <div className='flex items-center gap-3'>
            <Link
              href='/chats'
              className='px-4 py-2 rounded-xl btn-gradient text-xs font-extrabold flex items-center gap-1 cursor-pointer'
            >
              {t('header.cta.go_to_chats')}
              <ArrowRight size={12} />
            </Link>
            <Link
              href='/settings'
              className='w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black uppercase hover:bg-primary/20 transition-all overflow-hidden'
              title={t('header.cta.account_settings')}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className='w-full h-full object-cover'
                />
              ) : user.name ? (
                user.name[0]
              ) : (
                <UserIcon size={14} />
              )}
            </Link>
          </div>
        ) : (
          <div className='flex items-center gap-2'>
            <Link
              href='/auth/login'
              className='px-4 py-2 rounded-xl border border-border text-on-surface hover:bg-surface-container/50 text-xs font-bold transition-all cursor-pointer'
            >
              {t('header.cta.login')}
            </Link>
            <Link
              href='/auth/register'
              className='px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-opacity-95 transition-all cursor-pointer shadow-sm shadow-primary/10'
            >
              {t('header.cta.get_started')}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default LandingHeader
