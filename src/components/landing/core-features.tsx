'use client'

import { useTranslation } from '@/lib/i18n/client'
import { Cpu, Key, MessageSquare, ShieldCheck } from 'lucide-react'

const CoreFeatures = () => {
  const { t } = useTranslation('landing')

  return (
    <section className='max-w-6xl mx-auto px-8 py-16 space-y-6'>
      <h2 className='text-xl font-bold text-on-surface'>
        {t('core_features.title')}
      </h2>

      <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-border/10 mt-10'>
        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <MessageSquare size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              {t('core_features.dynamic.title')}
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              {t('core_features.dynamic.summary')}
            </p>
          </div>
        </div>

        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <Cpu size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              {t('core_features.gemini.title')}
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              {t('core_features.gemini.summary')}
            </p>
          </div>
        </div>

        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <Key size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              {t('core_features.mobile_sync.title')}
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              {t('core_features.mobile_sync.summary')}
            </p>
          </div>
        </div>

        <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
          <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className='text-sm font-bold text-on-surface'>
              {t('core_features.moderation.title')}
            </h4>
            <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
              {t('core_features.moderation.summary')}
            </p>
          </div>
        </div>
      </section>
    </section>
  )
}

export default CoreFeatures
