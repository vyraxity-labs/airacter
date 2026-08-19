import { auth } from '@/auth'
import { LandingClient } from '@/components/landing-client'
import { getTrendingCharacters } from '@/models/character/query'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  // Query top trending/public characters to showcase in the landing gallery
  const rawCharacters = await getTrendingCharacters()

  // Map database characters to safe serializable objects for client-side usage
  const featuredCharacters = rawCharacters.map((char) => ({
    id: char.id,
    name: char.name,
    slug: char.slug,
    description: char.description,
    avatarType: char.avatarType,
    avatarValue: char.avatarValue,
    avatarColor: char.avatarColor,
    category: char.category,
    tone: char.tone,
    isVerified: char.isVerified,
    usageCount: char.usageCount,
  }))

  const userContext = session?.user
    ? {
        id: session.user.id || '',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: (session.user as any).role || 'USER',
      }
    : null

  return (
    <LandingClient user={userContext} featuredCharacters={featuredCharacters} />
  )
}
