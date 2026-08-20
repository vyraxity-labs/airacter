import { Suspense } from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { DashboardShell } from '@/components/dashboard-shell'
import { MySidebar } from './my-sidebar'
import { redirect } from 'next/navigation'
import RolesHeader from '@/components/roles/roles-header'
import AllTab from '@/components/roles/all-tab'
import EmptyCharacterFilter from '@/components/roles/empty-character-filter'
import { getCharactersByTabs } from '@/models/character/query'
import { TrendingCharacter } from '@/models/character/types'
import CharacterList from './character-list'
import CharacterLibraryHead from '@/components/roles/character_library-head'

export const dynamic = 'force-dynamic'

interface MyCharactersPageProps {
  searchParams: Promise<{
    q?: string
    tab?: string
  }>
}

export default async function MyCharactersPage({
  searchParams,
}: MyCharactersPageProps) {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/auth/login')
  }

  const user = session.user
  const resolvedParams = await searchParams

  const q = resolvedParams.q || ''
  const tab = resolvedParams.tab || 'all' // "all", "created", "saved"

  let characters: TrendingCharacter[] = []
  let savedIds = new Set<string>()

  // Fetch saved IDs for rendering save toggles
  const userSaves = await db.characterSave.findMany({
    where: { userId: user.id },
    select: { characterId: true },
  })
  savedIds = new Set(userSaves.map((s) => s.characterId))

  // Query database based on tab
  characters = await getCharactersByTabs(tab, user.id, q)

  return (
    <Suspense fallback={null}>
      <DashboardShell user={user} sidebar={<MySidebar />}>
        {/* Top Header App Bar */}
        <RolesHeader q={q} tab={tab} />

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar pb-24'>
          {/* Glowing Background Ambience */}
          <div className='fixed top-[-10%] right-[-10%] w-125 h-125 bg-primary/5 blur-[120px] -z-10 pointer-events-none'></div>
          <div className='fixed bottom-[-10%] left-[-10%] w-150 h-150 bg-secondary/5 blur-[150px] -z-10 pointer-events-none'></div>

          {/* Featured Engine Promo Banner */}
          {tab === 'all' && !q && <AllTab />}

          {/* Grid Section */}
          <section>
            <CharacterLibraryHead />

            {characters.length === 0 ? (
              <EmptyCharacterFilter />
            ) : (
              <CharacterList
                characters={characters}
                savedIds={savedIds}
                userId={user.id}
              />
            )}
          </section>
        </div>
      </DashboardShell>
    </Suspense>
  )
}
