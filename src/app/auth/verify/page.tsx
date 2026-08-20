'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { STARTING_TOKEN } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n/client'

function VerifyContent() {
  const { t } = useTranslation('auth')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError(t('verify.error_token_missing'))
      setLoading(false)
      return
    }

    const verifyEmailToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || t('verify.error_token_expired'))
        } else {
          setSuccess(true)
        }
      } catch (err) {
        console.error('Email verification failed:', err)
        setError(t('verify.error_network_try_again'))
      } finally {
        setLoading(false)
      }
    }

    verifyEmailToken()
  }, [token, t])

  return (
    <Card className='glass-panel border-0 ring-0 p-8 md:p-10 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center justify-center theme-transition'>
      <CardContent className='p-0 flex flex-col items-center gap-6 w-full justify-center'>
        {loading && (
          <>
            <div className='w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary animate-spin'>
              <Loader size={32} />
            </div>
            <h2 className='text-2xl font-bold text-foreground'>
              {t('verify.verifying_email_title')}
            </h2>
            <p className='text-sm text-on-surface-variant leading-relaxed'>
              {t('verify.verifying_email_desc')}
            </p>
          </>
        )}

        {success && !loading && (
          <>
            <div className='w-20 h-20 rounded-full bg-linear-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 animate-bounce'>
              <CheckCircle size={40} />
            </div>
            <h2 className='text-2xl font-bold text-foreground'>
              {t('verify.verification_success_title')}
            </h2>

            <div className='p-4 bg-primary/10 border border-primary/20 rounded-xl max-w-xs w-full'>
              <p className='text-xs font-bold text-primary tracking-wider uppercase mb-1'>
                {t('verify.signup_bonus_credited_label')}
              </p>
              <p className='text-lg font-extrabold text-foreground flex items-center justify-center gap-1'>
                <Sparkles size={18} className='text-primary' /> +
                {STARTING_TOKEN} Tokens
              </p>
            </div>

            <p className='text-sm text-on-surface-variant leading-relaxed'>
              {t('verify.verification_success_desc')}
            </p>

            <Link
              href='/auth/login?verified=true'
              className={cn(
                buttonVariants({ variant: 'gradient' }),
                'h-12 w-full rounded-2xl font-semibold cursor-pointer flex items-center justify-center',
              )}
            >
              {t('verify.continue_to_login_button')}
            </Link>
          </>
        )}

        {error && !loading && (
          <>
            <div className='w-20 h-20 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error'>
              <AlertCircle size={40} />
            </div>
            <h2 className='text-2xl font-bold text-foreground'>
              {t('verify.verification_failed_title')}
            </h2>
            <p className='text-sm text-on-surface-variant leading-relaxed'>
              {error}
            </p>
            <div className='w-full space-y-3 pt-4'>
              <Link
                href='/auth/register'
                className={cn(
                  buttonVariants({ variant: 'gradient' }),
                  'h-12 w-full rounded-2xl font-semibold cursor-pointer flex items-center justify-center',
                )}
              >
                {t('verify.back_to_registration_button')}
              </Link>
              <p className='text-xs text-on-surface-variant'>
                {t('verify.need_another_code_label')}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyPage() {
  const { t } = useTranslation('auth')

  return (
    <div className='grow flex items-center justify-center p-6 relative overflow-hidden min-h-screen bg-background text-foreground transition-colors duration-300'>
      {/* Background ambient glowing balls */}
      <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse' />
      <div
        className='absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse'
        style={{ animationDelay: '2s' }}
      />

      <Suspense
        fallback={
          <Card className='glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center justify-center'>
            <CardContent className='p-0 flex flex-col items-center gap-6'>
              <div className='w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary animate-spin'>
                <Loader size={32} />
              </div>
              <h2 className='text-2xl font-bold text-foreground'>
                {t('verify.loading_title')}
              </h2>
            </CardContent>
          </Card>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  )
}
