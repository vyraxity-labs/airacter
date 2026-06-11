import Link from 'next/link'
import { Card, CardContent } from '../ui/card'
import { CheckCircle } from 'lucide-react'

const RegisteredSuccessView = ({ email }: { email: string }) => {
  return (
    <Card className='glass-panel border-0 ring-0 p-8 md:p-12 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center space-y-6 theme-transition animate-in fade-in zoom-in duration-500'>
      <CardContent className='p-0 flex flex-col items-center gap-5 w-full'>
        <div className='w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-2 text-white shadow-md shadow-primary/20'>
          <CheckCircle size={40} />
        </div>
        <h2 className='text-2xl font-bold text-foreground'>Verify Email</h2>
        <p className='text-sm text-on-surface-variant leading-relaxed'>
          We've sent a verification link to{' '}
          <span className='text-primary font-semibold block mt-1'>{email}</span>
          . Please check your inbox and click the link to activate your Airacter
          account.
        </p>

        <div className='w-full space-y-4 pt-4'>
          <Link
            href='/auth/login'
            className='w-full block py-3.5 rounded-xl font-semibold btn-gradient text-white active:scale-98 transition-all shadow-md shadow-primary/10 text-center'
          >
            Back to Login
          </Link>
          <div className='text-xs text-on-surface-variant flex justify-center gap-1'>
            <span>Need help?</span>
            <Link
              href='#'
              className='text-secondary hover:underline font-medium'
            >
              Contact Support
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RegisteredSuccessView
