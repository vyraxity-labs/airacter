import { Suspense } from 'react'
import { Loader } from 'lucide-react'
import LoginContent from '@/components/auth/login-content'

export default function LoginPage() {
  return (
    <div className='flex-grow flex items-center justify-center p-4 relative overflow-hidden min-h-screen bg-background text-foreground transition-colors duration-300'>
      {/* Ambient background glows */}
      <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse' />
      <div
        className='absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse'
        style={{ animationDelay: '2s' }}
      />

      <Suspense
        fallback={
          <div className='glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center space-y-6'>
            <div className='w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary animate-spin'>
              <Loader size={32} />
            </div>
            <h2 className='text-2xl font-bold text-foreground'>Loading</h2>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  )
}
