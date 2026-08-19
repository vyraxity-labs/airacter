import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

interface LogoProps {
  showName?: boolean
  variant?: 'horizontal' | 'vertical'
  size?: 'text' | 'icon' | 'medium' | 'large'
  href?: string
}

const Logo = ({
  href,
  showName = true,
  variant = 'horizontal',
  size = 'medium',
}: LogoProps) => {
  const textSizeMap = {
    text: 'text-base',
    icon: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
  }
  const iconSizeMap = {
    text: 16,
    icon: 20,
    medium: 24,
    large: 30,
  }
  const variantMap = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  }
  const roundMap = {
    text: 'rounded-sm',
    icon: 'rounded-md',
    medium: 'rounded-lg',
    large: 'rounded-xl',
  }

  return (
    <LogoWrapper href={href} className={variantMap[variant]}>
      <div
        className={cn(
          'bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm shadow-primary/20',
          roundMap[size],
        )}
        style={{
          width: iconSizeMap[size] * 2 + 'px',
          height: iconSizeMap[size] * 2 + 'px',
        }}
      >
        <Sparkles size={iconSizeMap[size]} />
      </div>
      {showName && (
        <span
          className={cn(
            'font-extrabold text-sm text-on-surface tracking-tight',
            textSizeMap[size],
          )}
        >
          Airacter
        </span>
      )}
    </LogoWrapper>
  )
}

export default Logo

const LogoWrapper = ({
  href,
  className,
  children,
}: {
  href?: string
  className?: string
  children: ReactNode
}) => {
  const classes = cn('flex items-center gap-2', className)

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return <div className={classes}>{children}</div>
}
