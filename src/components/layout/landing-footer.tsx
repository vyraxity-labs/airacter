'use client'

import { useTranslation } from '@/lib/i18n/client'
import { Globe } from 'lucide-react'

const LandingFooter = () => {
  const { t: t1 } = useTranslation('common')
  const { t: t2 } = useTranslation('landing')

  return (
    <footer className='mt-auto py-8 w-full border-t border-border/10 flex justify-between items-center px-8 text-xs text-on-surface-variant select-none bg-surface/20'>
      <div>
        &copy; {new Date().getFullYear()} {t1('app_name')}.{' '}
        {t2('footer.all_rights')}
      </div>
      <div className='flex items-center gap-2'>
        <Globe size={12} className='text-primary' />
        <span>{t2('footer.vyraxity')}</span>
      </div>
    </footer>
  )
}

export default LandingFooter
