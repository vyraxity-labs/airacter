import { db } from '@/lib/db'
import { auth } from '@/auth'
import MySidebarClient from '@/components/character/my-sidebar-client'

export async function MySidebar() {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }

  const userId = session.user.id

  // Fetch characters created by the user or saved in their library
  const createdCharacters = await db.character.findMany({
    where: { createdBy: userId },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })

  return <MySidebarClient createdCharacters={createdCharacters} />
}
