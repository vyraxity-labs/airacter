import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import { ThemeProvider, themeScript } from '@/components/theme-provider'
import './globals.css'
import { cn } from '@/lib/utils'
import { AppProvider } from '@/providers/store'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Airacter — Persona Chat Platform',
  description:
    'A character-driven AI chat platform where every conversation is shaped by a persona.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={cn('h-full', 'antialiased', 'font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className='min-h-full flex flex-col theme-transition bg-background text-foreground'
        suppressHydrationWarning
      >
        <AppProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AppProvider>
      </body>
    </html>
  )
}
