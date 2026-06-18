import { Suspense } from 'react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard-shell'
import { ExploreSidebar } from './explore-sidebar'
import { ExploreSort } from './explore-sort'
import { CharacterCard } from '@/components/character/character-card'
import { redirect } from 'next/navigation'
import { runExplorePageQuery } from '@/models/character/query'
import TrendingSection from '@/components/trending/trending-section'
import TrendingPagination from '@/components/trending/trending-pagination'
import EmptyCharacterRender from '@/components/trending/empty-character-render'

export const dynamic = 'force-dynamic'

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
    page?: string
  }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/auth/login')
  }

  const user = session.user
  const resolvedParams = await searchParams

  const q = resolvedParams.q || ''
  const category = resolvedParams.category || 'all'
  const sort = resolvedParams.sort || 'popular'
  const parsedPage = parseInt(resolvedParams.page || '1', 10)
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)

  const limit = 8
  const skip = (page - 1) * limit

  // Run DB queries in parallel
  const { characters, total, saves, trending } = await runExplorePageQuery(
    sort,
    category,
    skip,
    limit,
    page,
    session.user.id,
    q,
  )

  const totalPages = Math.ceil(total / limit)
  const savedIds = new Set(saves.map((s) => s.characterId))

  return (
    <Suspense fallback={null}>
      <DashboardShell user={user} sidebar={<ExploreSidebar />}>
        <div className='w-full grow p-6 md:p-10 pb-24 overflow-y-auto custom-scrollbar select-none'>
          {/* Ambient Glowing Effects */}
          <div className='fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 pointer-events-none'></div>
          <div className='fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/5 blur-[150px] -z-10 pointer-events-none'></div>

          {/* 1. Trending Section (only show on page 1 and when not filtering heavily) */}
          {page === 1 && !q && category === 'all' && trending.length > 0 && (
            <TrendingSection trending={trending} />
          )}

          {/* 2. Main Character Gallery */}
          <section>
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-8 border-b border-border/10 pb-4'>
              <div className='flex items-center gap-3'>
                <h2 className='text-xl font-bold text-on-surface'>
                  {q || category !== 'all'
                    ? 'Search Results'
                    : 'Public Personas'}
                </h2>
                <span className='text-xs px-2.5 py-1 bg-surface-container border border-border/20 text-on-surface-variant font-semibold rounded-full'>
                  {total} {total === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              <ExploreSort />
            </div>

            {characters.length === 0 ? (
              <EmptyCharacterRender />
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char as any}
                    isSaved={savedIds.has(char.id)}
                    currentUserId={user.id}
                    variant='explore'
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <TrendingPagination
                page={page}
                category={category}
                q={q}
                sort={sort}
                totalPages={totalPages}
              />
            )}
          </section>
        </div>
      </DashboardShell>
    </Suspense>
  )
}
