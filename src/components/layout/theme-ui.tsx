'use client'

import { useThemeStore } from '@/hooks/use-theme-store'
import { useTranslation } from '@/lib/i18n/client'
import { Moon, Sun } from 'lucide-react'

const ThemeUI = () => {
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation('landing')

  return (
    <button
      onClick={toggleTheme}
      className='text-on-surface-variant hover:text-on-surface p-2.5 hover:bg-surface-container rounded-xl transition-colors scale-95 active:scale-90 cursor-pointer'
      title={
        theme === 'dark'
          ? t('header.theme.switch_to_light')
          : t('header.theme.switch_to_dark')
      }
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export default ThemeUI
