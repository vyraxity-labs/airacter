'use client'

import { signIn } from 'next-auth/react'
import { Button } from '../ui/button'

const GoogleOAuthLogin = ({ loading }: { loading: boolean }) => {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <>
      {/* Divider */}
      <div className='relative my-4'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-outline-variant/20' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-surface px-4 text-on-surface-variant/70'>
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Login Button using shadcn Button */}
      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        variant='outline'
        className='h-12 w-full border border-outline-variant/30 rounded-2xl flex items-center justify-center gap-3 bg-surface-container-highest/30 hover:bg-surface-container-highest/60 transition-all font-semibold text-sm text-foreground active:scale-98 disabled:opacity-50 cursor-pointer theme-transition'
      >
        <svg className='w-4 h-4 shrink-0' viewBox='0 0 24 24'>
          <path
            d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            fill='#4285F4'
          />
          <path
            d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            fill='#34A853'
          />
          <path
            d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
            fill='#FBBC05'
          />
          <path
            d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            fill='#EA4335'
          />
        </svg>
        <span>Google Account</span>
      </Button>
    </>
  )
}

export default GoogleOAuthLogin
