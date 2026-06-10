'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Zap, Flame, Check, Loader2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PackOption {
  id: 'lite' | 'standard' | 'pro'
  name: string
  price: string
  tokens: number
  description: string
  icon: React.ReactNode
  features: string[]
  popular?: boolean
}

export function UpgradeClient() {
  const router = useRouter()
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const packs: PackOption[] = [
    {
      id: 'lite',
      name: 'Airacter Lite',
      price: '$4.99',
      tokens: 50000,
      description: 'Ideal for occasional casual chats and minor customization.',
      icon: <Sparkles className='text-primary' size={24} />,
      features: [
        '50,000 High-Speed Tokens',
        'Core Character Directory Access',
        'Standard Response Times',
        'Lifetime Roll-over Ledger',
      ],
    },
    {
      id: 'standard',
      name: 'Airacter Standard',
      price: '$9.99',
      tokens: 150000,
      description: 'Best for regular writers and persona creators.',
      icon: <Zap className='text-secondary' size={24} />,
      popular: true,
      features: [
        '150,000 High-Speed Tokens',
        'Complete Directory & Custom Avatars',
        'Priority Response Processing',
        'No Daily API Rate Limits',
        'Lifetime Roll-over Ledger',
      ],
    },
    {
      id: 'pro',
      name: 'Airacter Pro',
      price: '$19.99',
      tokens: 400000,
      description: 'Designed for power users, developers, and writers.',
      icon: <Flame className='text-tertiary' size={24} />,
      features: [
        '400,000 High-Speed Tokens',
        'All Characters & Custom Builders',
        'Ultra-Fast Priority Streaming',
        'Third-Party Mobile API Access',
        'Lifetime Roll-over Ledger',
      ],
    },
  ]

  const handleCheckout = async (packId: 'lite' | 'standard' | 'pro') => {
    setLoadingPackId(packId)
    setErrorMsg('')

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start checkout')
      }

      if (isMounted.current) {
        router.push(data.checkoutUrl)
      }
    } catch (err: any) {
      if (isMounted.current) {
        setErrorMsg(err.message || 'An error occurred starting payment.')
        setLoadingPackId(null)
      }
    }
  }

  return (
    <div className='flex-grow min-h-screen overflow-y-auto custom-scrollbar select-none bg-background pb-24'>
      {/* TOP HEADER */}
      <div className='max-w-6xl mx-auto pt-16 px-8 text-center space-y-4'>
        <span className='text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider'>
          Token Workspace
        </span>
        <h1 className='text-3xl md:text-5xl font-black text-on-surface tracking-tight'>
          Upgrade Your Creative Flow
        </h1>
        <p className='text-sm md:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed'>
          Choose a token package to power your AI character interactions. Access
          top-tier models with zero speed throttle.
        </p>

        {errorMsg && (
          <div className='max-w-md mx-auto p-4 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold'>
            {errorMsg}
          </div>
        )}
      </div>

      {/* PRICING GRID */}
      <div className='max-w-6xl mx-auto px-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch'>
        {packs.map((pack) => (
          <article
            key={pack.id}
            className={cn(
              'glass-panel rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative select-none',
              pack.popular
                ? 'border-secondary/40 shadow-xl shadow-secondary/5 bg-secondary/[0.01] md:-translate-y-2 scale-102'
                : 'border-border/30 hover:border-primary/20',
            )}
          >
            {pack.popular && (
              <span className='absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md'>
                Popular Choice
              </span>
            )}

            <div>
              {/* Header */}
              <div className='flex justify-between items-center mb-6'>
                <div className='w-12 h-12 rounded-2xl bg-surface-container/50 flex items-center justify-center border border-border/20'>
                  {pack.icon}
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-black text-on-surface'>
                    {pack.price}
                  </div>
                  <div className='text-[10px] text-on-surface-variant uppercase font-bold tracking-wider'>
                    one-time buy
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className='text-lg font-bold text-on-surface mb-2'>
                {pack.name}
              </h3>
              <p className='text-xs text-on-surface-variant leading-relaxed mb-6 h-12'>
                {pack.description}
              </p>

              {/* Token Display */}
              <div className='bg-surface-container/30 border border-border/10 rounded-2xl p-4 mb-6'>
                <span className='text-[10px] text-on-surface-variant uppercase font-bold tracking-widest block mb-0.5'>
                  Includes
                </span>
                <div className='flex items-baseline gap-1'>
                  <span className='text-3xl font-black text-on-surface'>
                    {pack.tokens.toLocaleString()}
                  </span>
                  <span className='text-xs font-bold text-primary'>tokens</span>
                </div>
              </div>

              {/* Features List */}
              <ul className='space-y-3 mb-8'>
                {pack.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className='flex items-start gap-2.5 text-xs text-on-surface-variant font-medium'
                  >
                    <Check className='text-primary shrink-0 mt-0.5' size={14} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buy CTA */}
            <button
              onClick={() => handleCheckout(pack.id)}
              disabled={loadingPackId !== null}
              className={cn(
                'w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all scale-98 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm',
                pack.popular
                  ? 'bg-secondary text-white hover:bg-opacity-95 shadow-secondary/10'
                  : 'bg-primary text-white hover:bg-opacity-95 shadow-primary/10',
                loadingPackId !== null && 'opacity-75 cursor-not-allowed',
              )}
            >
              {loadingPackId === pack.id ? (
                <>
                  <Loader2 className='animate-spin' size={14} />
                  Initiating Checkout...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Buy {pack.name.replace('Airacter ', '')}
                </>
              )}
            </button>
          </article>
        ))}
      </div>

      {/* SUPPORT TIERS INFO */}
      <footer className='max-w-md mx-auto text-center mt-12 px-8'>
        <div className='inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-medium'>
          <HelpCircle size={14} className='text-primary' />
          <span>Need custom or bulk options?</span>
          <a
            href='mailto:support@airacter.com'
            className='text-primary hover:underline font-bold'
          >
            Contact Enterprise Support
          </a>
        </div>
      </footer>
    </div>
  )
}
