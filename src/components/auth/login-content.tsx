'use client'

import { AlertCircle, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import Link from 'next/link'
import { Button } from '../ui/button'
import GoogleOAuthLogin from './google-oauth-login'
import Logo from '../general/logo'
import { useTranslation } from '@/lib/i18n/client'

const LoginContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation('auth')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // Show verified success message if redirected from verify page
    if (searchParams.get('verified') === 'true') {
      setSuccessMsg(t('email_verified_success'))
    }
    // Show error if redirected from next-auth error callbacks
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(
        oauthError === 'OAuthSignin' || oauthError === 'OAuthCallback'
          ? t('error_google_oauth')
          : t('error_auth_generic'),
      )
    }
  }, [searchParams, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError(t('error_invalid_credentials'))
        } else {
          setError(result.error)
        }
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      console.error('An unexpected error occurred during login:', err)
      setError(t('error_unexpected'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='w-full max-w-105 z-10 py-8'>
      {/* Brand identity */}
      <div className='flex flex-col items-center mb-8 space-y-2'>
        <Logo size='large' variant='vertical' href='/' />
        <p className='text-sm text-on-surface-variant'>{t('login.subtitle')}</p>
      </div>

      {/* Login Form Card using shadcn Card */}
      <Card className='glass-panel border-0 ring-0 py-8 px-6 rounded-[2rem] shadow-2xl theme-transition'>
        <CardContent className='p-0 flex flex-col gap-5'>
          {/* Notifications */}
          {error && (
            <div className='p-3 rounded-xl bg-error/15 border border-error/30 text-error text-sm flex items-start gap-2'>
              <AlertCircle size={18} className='shrink-0 mt-0.5' />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className='p-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm flex items-start gap-2'>
              <Sparkles size={18} className='shrink-0 mt-0.5' />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider'
              >
                {t('login.email_label')}
              </Label>
              <div className='relative group'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors z-10'>
                  <Mail size={16} />
                </span>
                <Input
                  id='email'
                  type='email'
                  placeholder='name@company.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='h-12 w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center ml-2'>
                <Label
                  htmlFor='password'
                  className='text-xs font-semibold text-on-surface-variant uppercase tracking-wider'
                >
                  {t('login.password_label')}
                </Label>
                <Link
                  href='#'
                  className='text-xs font-semibold text-primary hover:underline'
                >
                  {t('login.forgot_link')}
                </Link>
              </div>
              <div className='relative group'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors z-10'>
                  <Lock size={16} />
                </span>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='h-12 w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button using shadcn Button */}
            <Button
              type='submit'
              disabled={loading}
              variant='gradient'
              className='h-12 w-full rounded-2xl font-semibold flex items-center justify-center gap-2 mt-6 cursor-pointer'
            >
              <span>
                {loading
                  ? t('login.logging_in_button')
                  : t('login.login_button')}
              </span>
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <GoogleOAuthLogin loading={loading} />
        </CardContent>
      </Card>

      {/* Footer Link */}
      <p className='text-center mt-6 text-sm text-on-surface-variant'>
        {t('login.no_account_label')}
        <Link
          href='/auth/register'
          className='text-primary font-semibold hover:text-primary/80 transition-colors ml-1'
        >
          {t('login.register_link')}
        </Link>
      </p>
    </main>
  )
}

export default LoginContent
