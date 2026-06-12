'use client'

import RegisterContent from '@/components/auth/register-content'

export default function RegisterPage() {
  return (
    <div className='flex-grow flex items-center justify-center p-6 relative overflow-hidden min-h-screen bg-background text-foreground transition-colors duration-300'>
      {/* Background ambient glowing balls */}
      <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse' />
      <div
        className='absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse'
        style={{ animationDelay: '2s' }}
      />

      {/* Main Registration Layout */}
      <RegisterContent />
    </div>
  )
}
