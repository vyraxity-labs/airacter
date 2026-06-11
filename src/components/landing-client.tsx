import { Character } from '@/models/character/types'
import { User } from '@/models/user/types'
import LandingHeader from './layout/landing-header'
import Hero from './landing/hero'
import FeaturedCharacters from './landing/featured-characters'
import CoreFeatures from './landing/core-features'
import LandingFooter from './layout/landing-footer'

interface LandingClientProps {
  user: User | null
  featuredCharacters: Character[]
}

export function LandingClient({
  user,
  featuredCharacters,
}: LandingClientProps) {
  return (
    <div className='min-h-screen flex flex-col bg-background select-none relative overflow-hidden'>
      {/* Background ambient glowing spheres */}
      <div className='absolute top-1/6 left-1/5 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10' />
      <div className='absolute bottom-1/5 right-1/5 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10' />

      {/* TOP HEADER */}
      <LandingHeader user={user} />

      {/* HERO SECTION */}
      <Hero user={user} />

      {/* FEATURED LIVE CHARACTERS SHOWCASE */}
      {featuredCharacters.length > 0 && (
        <FeaturedCharacters
          featuredCharacters={featuredCharacters}
          user={user}
        />
      )}

      {/* CORE FEATURES LIST */}
      <CoreFeatures />

      {/* FOOTER */}
      <LandingFooter />
    </div>
  )
}
