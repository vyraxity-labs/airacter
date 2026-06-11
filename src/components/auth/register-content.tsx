'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import GoogleOAuthLogin from './google-oauth-login'
import Logo from '../general/logo'
import RegisteredSuccessView from './registered-success-view'

const RegisterContent = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to register. Please try again.')
      } else {
        setRegistered(true)
      }
    } catch (err: any) {
      setError('An unexpected network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative z-10 w-full max-w-[1000px] grid md:grid-cols-2 gap-12 px-4 py-8 items-center'>
      {/* Brand Narrative Column (Desktop Only) */}
      {!registered && (
        <div className='hidden md:flex flex-col justify-center space-y-8 pr-6'>
          <div className='space-y-4'>
            <Logo size='large' variant='horizontal' href='/' />
            <p className='text-lg text-on-surface-variant max-w-md leading-relaxed'>
              Join the premier platform for AI personas. Craft, interact, and
              evolve your digital companions in a professional playground
              designed for creators.
            </p>
          </div>

          {/* Features Row */}
          <div className='grid grid-cols-2 gap-4'>
            <Card className='glass-panel border-0 ring-0 p-5 rounded-xl space-y-2 text-left bg-glass-bg/60'>
              <CardContent className='p-0 space-y-2'>
                <Sparkles size={24} className='text-primary' />
                <h3 className='font-semibold text-sm text-foreground'>
                  Persona Flow
                </h3>
                <p className='text-xs text-on-surface-variant leading-relaxed'>
                  Persistent prompts with rich contextual reasoning.
                </p>
              </CardContent>
            </Card>
            <Card className='glass-panel border-0 ring-0 p-5 rounded-xl space-y-2 text-left bg-glass-bg/60'>
              <CardContent className='p-0 space-y-2'>
                <User size={24} className='text-secondary' />
                <h3 className='font-semibold text-sm text-foreground'>
                  Character Hub
                </h3>
                <p className='text-xs text-on-surface-variant leading-relaxed'>
                  Discover public personas or build private companions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Form Column */}
      <div
        className={`flex flex-col items-center justify-center w-full ${registered ? 'md:col-span-2' : ''}`}
      >
        <div className='flex items-center gap-2 mb-8 md:hidden'>
          <Logo href='/' />
        </div>
        {!registered ? (
          /* Registration Card using shadcn Card */
          <Card className='glass-panel border-0 ring-0 py-8 px-6 md:p-10 rounded-[2rem] w-full max-w-md shadow-2xl theme-transition'>
            <CardContent className='p-0 flex flex-col gap-5'>
              <div className='mb-2 text-center md:text-left'>
                <h2 className='text-2xl font-bold text-foreground mb-1'>
                  Create Account
                </h2>
                <p className='text-sm text-on-surface-variant'>
                  Enter your details to start your journey.
                </p>
              </div>

              {error && (
                <div className='p-3 rounded-xl bg-error/15 border border-error/30 text-error text-sm flex items-start gap-2'>
                  <AlertCircle size={18} className='shrink-0 mt-0.5' />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-1'>
                  <Label
                    htmlFor='name'
                    className='text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider'
                  >
                    Full Name
                  </Label>
                  <div className='relative group'>
                    <span className='absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors z-10'>
                      <User size={16} />
                    </span>
                    <Input
                      id='name'
                      type='text'
                      placeholder='John Doe'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition'
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <Label
                    htmlFor='email'
                    className='text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider'
                  >
                    Email Address
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
                      className='h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition'
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <Label
                      htmlFor='password'
                      className='text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider'
                    >
                      Password
                    </Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition'
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label
                      htmlFor='confirmPassword'
                      className='text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider'
                    >
                      Confirm
                    </Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      placeholder='••••••••'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className='h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition'
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type='submit'
                  disabled={loading}
                  variant='gradient'
                  className='h-12 w-full rounded-2xl font-semibold flex items-center justify-center gap-2 mt-6 cursor-pointer'
                >
                  <span>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </span>
                  {!loading && <ArrowRight size={16} />}
                </Button>
              </form>

              {/* Google Account signup */}
              <GoogleOAuthLogin loading={loading} />

              <p className='mt-6 text-center text-sm text-on-surface-variant'>
                Already have an account?
                <Link
                  href='/auth/login'
                  className='text-primary font-semibold hover:text-primary/80 transition-colors ml-1'
                >
                  Login
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Success View */
          <RegisteredSuccessView email={email} />
        )}
      </div>
    </div>
  )
}

export default RegisterContent
