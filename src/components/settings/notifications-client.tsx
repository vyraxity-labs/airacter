'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Mail, ShieldAlert, Coins, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/client'

interface NotificationSetting {
  id: string
  titleKey: string
  descKey: string
  category: 'email' | 'security' | 'usage'
  channel: 'email' | 'sms' | 'push' | 'in_app'
  icon: React.ReactNode
}

export function NotificationsClient() {
  const { t } = useTranslation('settings')
  const [settings, setSettings] = useState<Record<string, boolean>>({
    newsletter: true,
    security_alerts: true,
    weekly_digest: false,
    token_milestones: true,
    low_token_warnings: true,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showSavedToast, setShowSavedToast] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchPreferences() {
      try {
        setIsLoading(true)
        const res = await fetch('/api/settings/notifications')
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.preferences)) {
            const loadedSettings: Record<string, boolean> = {}
            data.preferences.forEach(
              (pref: { eventType: string; enabled: boolean }) => {
                loadedSettings[pref.eventType] = pref.enabled
              },
            )
            if (isMounted) {
              setSettings((prev) => ({ ...prev, ...loadedSettings }))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load notification preferences', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPreferences()

    return () => {
      isMounted = false
    }
  }, [])

  const handleToggle = async (
    id: string,
    channel: 'email' | 'sms' | 'push' | 'in_app',
  ) => {
    const previousState = settings[id] ?? false
    const nextState = !previousState
    setSavingId(id)

    // Optimistically update local UI state
    setSettings((prev) => ({ ...prev, [id]: nextState }))

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: id,
          channel,
          enabled: nextState,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update notification preference')
      }

      setShowSavedToast(true)
      setTimeout(() => setShowSavedToast(false), 2000)
    } catch (err) {
      console.error('Failed to update notification preference:', err)
      // Revert on error
      setSettings((prev) => ({ ...prev, [id]: previousState }))
    } finally {
      setSavingId(null)
    }
  }

  const notificationOptions: NotificationSetting[] = [
    {
      id: 'newsletter',
      titleKey: 'notifications.options.newsletter_title',
      descKey: 'notifications.options.newsletter_desc',
      category: 'email',
      channel: 'email',
      icon: <Mail className='text-primary' size={18} />,
    },
    {
      id: 'weekly_digest',
      titleKey: 'notifications.options.weekly_digest_title',
      descKey: 'notifications.options.weekly_digest_desc',
      category: 'email',
      channel: 'email',
      icon: <Mail className='text-primary' size={18} />,
    },
    {
      id: 'security_alerts',
      titleKey: 'notifications.options.security_alerts_title',
      descKey: 'notifications.options.security_alerts_desc',
      category: 'security',
      channel: 'email',
      icon: <ShieldAlert className='text-primary' size={18} />,
    },
    {
      id: 'token_milestones',
      titleKey: 'notifications.options.token_milestones_title',
      descKey: 'notifications.options.token_milestones_desc',
      category: 'usage',
      channel: 'in_app',
      icon: <Coins className='text-primary' size={18} />,
    },
    {
      id: 'low_token_warnings',
      titleKey: 'notifications.options.low_token_warnings_title',
      descKey: 'notifications.options.low_token_warnings_desc',
      category: 'usage',
      channel: 'email',
      icon: <Coins className='text-primary' size={18} />,
    },
  ]

  return (
    <div className='flex-1 min-h-screen overflow-y-auto custom-scrollbar select-none bg-background'>
      {/* TOP APP BAR */}
      <header className='sticky top-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-surface/80 border-b border-border/40 backdrop-blur-md'>
        <div className='flex items-center gap-6'>
          <h2 className='text-sm font-bold text-primary flex items-center gap-2'>
            <Bell size={16} />
            {t('notifications.header_title')}
          </h2>
        </div>

        {/* Saved Status Indicator */}
        <div
          className={cn(
            'text-xs font-semibold text-primary flex items-center gap-1.5 transition-opacity duration-300 mr-4',
            showSavedToast ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Check size={14} />
          {t('notifications.auto_saved_toast')}
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className='max-w-4xl mx-auto py-10 px-8 space-y-8 pb-24'>
        {isLoading ? (
          <div className='py-24 flex justify-center items-center'>
            <Loader2 size={28} className='animate-spin text-primary' />
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Email Preferences */}
            <section className='glass-panel rounded-3xl p-8 space-y-6'>
              <div>
                <h3 className='text-base font-bold text-on-surface'>
                  {t('notifications.email_subscriptions_title')}
                </h3>
                <p className='text-xs text-on-surface-variant mt-0.5'>
                  {t('notifications.email_subscriptions_desc')}
                </p>
              </div>

              <div className='space-y-4'>
                {notificationOptions
                  .filter((opt) => opt.category === 'email')
                  .map((opt) => (
                    <div
                      key={opt.id}
                      className='flex items-start justify-between gap-6 p-4 rounded-2xl bg-surface-container/20 border border-border/20 hover:bg-surface-container/40 transition-all'
                    >
                      <div className='flex gap-4'>
                        <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5'>
                          {opt.icon}
                        </div>
                        <div>
                          <h4 className='text-xs font-bold text-on-surface'>
                            {t(opt.titleKey)}
                          </h4>
                          <p className='text-[11px] text-on-surface-variant leading-relaxed mt-1'>
                            {t(opt.descKey)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggle(opt.id, opt.channel)}
                        disabled={savingId === opt.id}
                        className={cn(
                          'w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer relative shrink-0',
                          settings[opt.id]
                            ? 'bg-primary'
                            : 'bg-surface-container-high',
                        )}
                      >
                        {savingId === opt.id ? (
                          <Loader2
                            size={12}
                            className='animate-spin text-white absolute left-1.5 top-1.5'
                          />
                        ) : (
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-all duration-300',
                              settings[opt.id]
                                ? 'translate-x-6'
                                : 'translate-x-0',
                            )}
                          />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </section>

            {/* Account & Usage Notifications */}
            <section className='glass-panel rounded-3xl p-8 space-y-6'>
              <div>
                <h3 className='text-base font-bold text-on-surface'>
                  {t('notifications.account_activity_title')}
                </h3>
                <p className='text-xs text-on-surface-variant mt-0.5'>
                  {t('notifications.account_activity_desc')}
                </p>
              </div>

              <div className='space-y-4'>
                {notificationOptions
                  .filter((opt) => opt.category !== 'email')
                  .map((opt) => (
                    <div
                      key={opt.id}
                      className='flex items-start justify-between gap-6 p-4 rounded-2xl bg-surface-container/20 border border-border/20 hover:bg-surface-container/40 transition-all'
                    >
                      <div className='flex gap-4'>
                        <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5'>
                          {opt.icon}
                        </div>
                        <div>
                          <h4 className='text-xs font-bold text-on-surface'>
                            {t(opt.titleKey)}
                          </h4>
                          <p className='text-[11px] text-on-surface-variant leading-relaxed mt-1'>
                            {t(opt.descKey)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggle(opt.id, opt.channel)}
                        disabled={savingId === opt.id}
                        className={cn(
                          'w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer relative shrink-0',
                          settings[opt.id]
                            ? 'bg-primary'
                            : 'bg-surface-container-high',
                        )}
                      >
                        {savingId === opt.id ? (
                          <Loader2
                            size={12}
                            className='animate-spin text-white absolute left-1.5 top-1.5'
                          />
                        ) : (
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-all duration-300',
                              settings[opt.id]
                                ? 'translate-x-6'
                                : 'translate-x-0',
                            )}
                          />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
