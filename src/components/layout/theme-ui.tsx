'use client'

import { useThemeStore } from '@/hooks/use-theme-store'
import { Moon, Sun } from 'lucide-react'

const ThemeUI = () => {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className='text-on-surface-variant hover:text-on-surface p-2.5 hover:bg-surface-container rounded-xl transition-colors scale-95 active:scale-90 cursor-pointer'
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export default ThemeUI
