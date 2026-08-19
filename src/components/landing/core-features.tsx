import { Cpu, Key, MessageSquare, ShieldCheck } from 'lucide-react'

const CoreFeatures = () => {
  return (
    <section className='max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-border/10 mt-10'>
      <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
        <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
          <MessageSquare size={18} />
        </div>
        <div>
          <h4 className='text-sm font-bold text-on-surface'>Dynamic Prompts</h4>
          <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
            Configure strict behaviors, rules, tone chips, and contextual
            instructions for custom personas.
          </p>
        </div>
      </div>

      <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
        <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
          <Cpu size={18} />
        </div>
        <div>
          <h4 className='text-sm font-bold text-on-surface'>Gemini Gateway</h4>
          <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
            Stream tokens with Google Gemini models. Real-time token tracking
            verifies and bills usage.
          </p>
        </div>
      </div>

      <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
        <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
          <Key size={18} />
        </div>
        <div>
          <h4 className='text-sm font-bold text-on-surface'>Mobile Sync API</h4>
          <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
            Generate 30-day pairing JWT keys in your account dashboard to
            connect external mobile client apps.
          </p>
        </div>
      </div>

      <div className='p-5 rounded-2xl bg-surface-container/20 border border-border/10 flex flex-col justify-between'>
        <div className='w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4'>
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className='text-sm font-bold text-on-surface'>
            Moderation & Security
          </h4>
          <p className='text-xs text-on-surface-variant leading-relaxed mt-1'>
            Full admin dashboard verification queues, content flag logs, and
            manual credit adjustment controls.
          </p>
        </div>
      </div>
    </section>
  )
}

export default CoreFeatures
