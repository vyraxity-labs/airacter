import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTranslation } from '@/lib/i18n/client'

interface LogoutProps {
  showLabel?: boolean
  className?: string
}

const Logout = ({ showLabel = false, className }: LogoutProps) => {
  const { t } = useTranslation('common')

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <button
      onClick={handleSignOut}
      className={
        className ||
        'text-on-surface-variant hover:text-destructive p-2.5 hover:bg-destructive/10 rounded-xl transition-colors scale-95 active:scale-90 cursor-pointer'
      }
      title={t('side_bottom_bar.logout')}
    >
      <LogOut size={18} />
      {showLabel && (
        <span className='text-[10px] mt-1 font-medium leading-none'>
          {t('side_bottom_bar.logout')}
        </span>
      )}
    </button>
  )
}

export default Logout
