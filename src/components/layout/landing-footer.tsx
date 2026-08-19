import { Globe } from 'lucide-react'

const LandingFooter = () => {
  return (
    <footer className='mt-auto py-8 w-full border-t border-border/10 flex justify-between items-center px-8 text-xs text-on-surface-variant select-none bg-surface/20'>
      <div>
        &copy; {new Date().getFullYear()} Airacter Labs. All rights reserved.
      </div>
      <div className='flex items-center gap-2'>
        <Globe size={12} className='text-primary' />
        <span>Stitch UI Specification</span>
      </div>
    </footer>
  )
}

export default LandingFooter
