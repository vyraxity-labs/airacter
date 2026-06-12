import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

const Logout = () => {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <button
      onClick={handleSignOut}
      className='text-on-surface-variant hover:text-destructive p-2.5 hover:bg-destructive/10 rounded-xl transition-colors scale-95 active:scale-90 cursor-pointer'
      title='Logout'
    >
      <LogOut size={18} />
    </button>
  )
}

export default Logout
