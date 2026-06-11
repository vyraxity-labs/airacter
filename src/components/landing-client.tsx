'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useThemeStore } from '@/hooks/use-theme-store'
import {
  Sun,
  Moon,
  Sparkles,
  MessageSquare,
  Cpu,
  ShieldCheck,
  Key,
  ArrowRight,
  User as UserIcon,
  Zap,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Character {
  id: string
  name: string
  slug: string
  description: string
  avatarType: 'emoji' | 'initials' | 'image'
  avatarValue: string
  avatarColor: string
  category: string
  tone: string[]
  isVerified: boolean
  usageCount: number
}

interface LandingClientProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
  featuredCharacters: Character[]
}

export function LandingClient({
  user,
  featuredCharacters,
}: LandingClientProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useThemeStore()

  const handleCharacterClick = (slug: string) => {
    if (user) {
      router.push(`/chats?character=${slug}`)
    } else {
      router.push(`/auth/login?callbackUrl=/chats?character=${slug}`)
    }
  }

  const renderCharacterAvatar = (char: Character) => {
    if (char.avatarType === 'image' && char.avatarValue) {
      return (
        <img
          src={char.avatarValue}
          alt={char.name}
          className='w-12 h-12 rounded-xl object-cover border border-border/10'
        />
      )
    }

    const initials = char.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()

    return (
      <div
        className='w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white border border-border/10 relative'
        style={{ backgroundColor: char.avatarColor }}
      >
        {char.avatarType === 'emoji' ? char.avatarValue : initials}
      </div>
    )
  }

  return (
    <div className='min-h-screen flex flex-col bg-background select-none relative overflow-hidden'>
      {/* Background ambient glowing spheres */}
      <div className='absolute top-1/6 left-1/5 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10' />
      <div className='absolute bottom-1/5 right-1/5 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10' />

      {/* TOP HEADER */}
      <header className='sticky top-0 z-50 h-16 w-full flex justify-between items-center px-8 bg-surface/70 border-b border-border/20 backdrop-blur-md'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm shadow-primary/20'>
            <Sparkles size={16} />
          </div>
          <span className='font-extrabold text-sm text-on-surface tracking-tight'>
            Airacter
          </span>
        </div>

        {/* Navigation Links */}
        <nav className='hidden md:flex items-center gap-6 text-xs font-bold text-on-surface-variant'>
          <Link
            href='/explore'
            className='hover:text-primary transition-colors'
          >
            Explore
          </Link>
          {user && (
            <>
              <Link
                href='/chats'
                className='hover:text-primary transition-colors'
              >
                Chats
              </Link>
              <Link
                href='/characters/my'
                className='hover:text-primary transition-colors'
              >
                My Library
              </Link>
              <Link
                href='/settings'
                className='hover:text-primary transition-colors'
              >
                Settings
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  href='/admin'
                  className='hover:text-primary transition-colors text-secondary'
                >
                  Admin Console
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
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            <div className='flex items-center gap-3'>
              <Link
                href='/chats'
                className='px-4 py-2 rounded-xl btn-gradient text-xs font-extrabold flex items-center gap-1 cursor-pointer'
              >
                Go to Chats
                <ArrowRight size={12} />
              </Link>
              <Link
                href='/settings'
                className='w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black uppercase hover:bg-primary/20 transition-all'
                title='Account Settings'
              >
                {user.name ? user.name[0] : <UserIcon size={14} />}
              </Link>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Link
                href='/auth/login'
                className='px-4 py-2 rounded-xl border border-border text-on-surface hover:bg-surface-container/50 text-xs font-bold transition-all cursor-pointer'
              >
                Log In
              </Link>
              <Link
                href='/auth/register'
                className='px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-opacity-95 transition-all cursor-pointer shadow-sm shadow-primary/10'
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className='max-w-4xl mx-auto pt-20 pb-16 px-8 text-center space-y-6'>
        <span className='inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider'>
          <Zap size={10} />
          Powered by Google Gemini Models
        </span>

        <h1 className='text-4xl md:text-6xl font-black text-on-surface tracking-tight leading-[1.1]'>
          Bring Your Custom <br />
          <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary'>
            AI Characters
          </span>{' '}
          to Life
        </h1>

        <p className='text-sm md:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed'>
          Create, customize, and converse with persistent AI personas shaped by
          custom rules. Fine-tune prompts, tone tags, and custom visual avatars
          instantly.
        </p>

        <div className='pt-4 flex flex-wrap justify-center gap-3.5'>
          {user ? (
            <Link
              href='/chats'
              className='px-7 py-3 rounded-full btn-gradient text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10'
            >
              Start Chatting
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link
                href='/auth/register'
                className='px-7 py-3 rounded-full btn-gradient text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10'
              >
                Start Free Today
                <ArrowRight size={14} />
              </Link>
              <Link
                href='/explore'
                className='px-7 py-3 rounded-full border border-border text-on-surface hover:bg-surface-container font-bold text-xs transition-all cursor-pointer'
              >
                Explore Personas
              </Link>
            </>
          )}
        </div>
      </section>

      {/* FEATURED LIVE CHARACTERS SHOWCASE */}
      {featuredCharacters.length > 0 && (
        <section className='max-w-6xl mx-auto px-8 py-10 space-y-6'>
          <div className='flex justify-between items-end'>
            <div>
              <h2 className='text-xl font-bold text-on-surface'>
                Trending Personas
              </h2>
              <p className='text-xs text-on-surface-variant mt-0.5'>
                Click any character below to initiate conversation.
              </p>
            </div>
            <Link
              href='/explore'
              className='text-xs text-primary font-bold hover:underline flex items-center gap-1'
            >
              View All Explore Gallery
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {featuredCharacters.map((char) => (
              <div
                key={char.id}
                onClick={() => handleCharacterClick(char.slug)}
                className='glass-panel rounded-3xl p-5 hover:border-primary/20 transition-all cursor-pointer flex flex-col justify-between h-44 hover:shadow-lg hover:-translate-y-0.5 select-none'
              >
                <div className='flex gap-4'>
                  {renderCharacterAvatar(char)}
                  <div className='space-y-1 flex-1'>
                    <div className='flex items-center gap-2'>
                      <h4 className='text-sm font-bold text-on-surface line-clamp-1'>
                        {char.name}
                      </h4>
                      {char.isVerified && (
                        <span className='text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider'>
                          Verified
                        </span>
                      )}
                    </div>
                    <span className='text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded uppercase font-bold tracking-wider w-fit block'>
                      {char.category}
                    </span>
                    <p className='text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1'>
                      {char.description}
                    </p>
                  </div>
                </div>

                <div className='pt-3 border-t border-border/10 flex justify-between items-center text-[10px] text-on-surface-variant'>
                  <span>
                    Tones: <strong>{char.tone.slice(0, 2).join(', ')}</strong>
                  </span>
                  <span>
                    Chats: <strong>{char.usageCount.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CORE FEATURES LIST */}
      <section className='max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-border/10 mt-10'>
        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <MessageSquare size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              Dynamic Prompts
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              Configure strict behaviors, rules, tone chips, and contextual
              instructions for custom personas.
            </p>
          </div>
        </div>

        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <Cpu size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              Gemini Gateway
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              Stream tokens with Google Gemini models. Real-time token tracking
              verifies and bills usage.
            </p>
          </div>
        </div>

        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <Key size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              Mobile Sync API
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              Generate 30-day pairing JWT keys in your account dashboard to
              connect external mobile client apps.
            </p>
          </div>
        </div>

        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              Moderation & Security
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              Full admin dashboard verification queues, content flag logs, and
              manual credit adjustment controls.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className='mt-auto py-8 w-full border-t border-border/10 flex justify-between items-center px-8 text-xs text-on-surface-variant select-none bg-surface/20'>
        <div>
          &copy; {new Date().getFullYear()} Airacter Labs. All rights reserved.
        </div>
        <div className='flex items-center gap-2'>
          <Globe size={12} className='text-primary' />
          <span>Stitch UI Specification</span>
        </div>
      </footer>
    </div>
  )
}
