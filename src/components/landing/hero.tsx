import { User } from '@/models/user/types'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

const Hero = ({ user }: { user: User | null }) => {
  return (
    <section className='max-w-4xl mx-auto pt-20 pb-16 px-8 text-center space-y-6'>
      <span className='inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider'>
        <Zap size={10} />
        Powered by Google Gemini Models
      </span>

      <h1 className='text-4xl md:text-6xl font-black text-on-surface tracking-tight leading-[1.1]'>
        Bring Your Custom <br />
        <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary'>
          AI Characters
        </span>{' '}
        to Life
      </h1>

      <p className='text-sm md:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed'>
        Create, customize, and converse with persistent AI personas shaped by
        custom rules. Fine-tune prompts, tone tags, and custom visual avatars
        instantly.
      </p>

      <div className='pt-4 flex flex-wrap justify-center gap-3.5'>
        {user ? (
          <Link
            href='/chats'
            className='px-7 py-3 rounded-full btn-gradient text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10'
          >
            Start Chatting
            <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            <Link
              href='/auth/register'
              className='px-7 py-3 rounded-full btn-gradient text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10'
            >
              Start Free Today
              <ArrowRight size={14} />
            </Link>
            <Link
              href='/explore'
              className='px-7 py-3 rounded-full border border-border text-on-surface hover:bg-surface-container font-bold text-xs transition-all cursor-pointer'
            >
              Explore Personas
            </Link>
          </>
        )}
      </div>
    </section>
  )
}

export default Hero
