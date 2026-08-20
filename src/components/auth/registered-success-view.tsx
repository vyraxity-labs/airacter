import Link from 'next/link'
import { Card, CardContent } from '../ui/card'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'

const RegisteredSuccessView = ({ email }: { email: string }) => {
  const { t } = useTranslation('auth')

  return (
    <Card className='glass-panel border-0 ring-0 p-8 md:p-12 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center space-y-6 theme-transition animate-in fade-in zoom-in duration-500'>
      <CardContent className='p-0 flex flex-col items-center gap-5 w-full'>
        <div className='w-20 h-20 rounded-full bg-linear-to-tr from-primary to-secondary flex items-center justify-center mb-2 text-white shadow-md shadow-primary/20'>
          <CheckCircle size={40} />
        </div>
        <h2 className='text-2xl font-bold text-foreground'>
          {t('registered.verify_email_title')}
        </h2>
        <p className='text-sm text-on-surface-variant leading-relaxed'>
          {t('registered.verification_sent_prefix')}{' '}
          <span className='text-primary font-semibold block mt-1'>{email}</span>
          {t('registered.verification_sent_suffix')}
        </p>

        <div className='w-full space-y-4 pt-4'>
          <Link
            href='/auth/login'
            className='w-full block py-3.5 rounded-xl font-semibold btn-gradient text-white active:scale-98 transition-all shadow-md shadow-primary/10 text-center'
          >
            {t('registered.back_to_login_button')}
          </Link>
          <div className='text-xs text-on-surface-variant flex justify-center gap-1'>
            <span>{t('registered.need_help_label')}</span>
            <Link
              href='#'
              className='text-secondary hover:underline font-medium'
            >
              {t('registered.contact_support_link')}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RegisteredSuccessView
