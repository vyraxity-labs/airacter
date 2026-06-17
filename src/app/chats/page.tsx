import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ChatClientWrapper } from '@/components/chat/chat-client-wrapper'
import { getUserTokenBalance } from '@/lib/tokens'
import { LOGIN_PAGE } from '@/auth.constants'
import { findCharacterBySlug } from '@/models/character/query'
import {
  findExistingUserChat,
  getAllLoggedInUserChats,
  initializeNewChat,
} from '@/models/chat/query'

export const dynamic = 'force-dynamic'

interface ChatsPageProps {
  searchParams: Promise<{
    chat?: string
    character?: string
  }>
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  // 1. Authenticate user session
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    redirect(LOGIN_PAGE)
  }

  const userId = session.user.id
  const resolvedParams = await searchParams
  const characterSlug = resolvedParams.character || ''
  let activeChatId = resolvedParams.chat || ''

  // 2. Redirect/Initialize chat if characterSlug is specified
  if (characterSlug) {
    const character = await findCharacterBySlug(characterSlug)

    if (character) {
      // Look for an existing chat session with this character
      const existingChat = await findExistingUserChat(userId, character.id)

      if (existingChat) {
        redirect(`/chats?chat=${existingChat.id}`)
      } else {
        // Initialize a new chat session copying the system prompt snapshot
        const newChat = await initializeNewChat(character, userId)

        if (!newChat) {
          return redirect('/chats')
        }

        redirect(`/chats?chat=${newChat.id}`)
      }
    }
  }

  // 3. Fetch all active chats for this user to render in sidebar
  const { data: chats, error, success } = await getAllLoggedInUserChats(userId)

  // If there are chats but no activeChatId selected, default to the most recent one
  if (!activeChatId && chats.length > 0) {
    redirect(`/chats?chat=${chats[0].id}`)
  }

  // 4. Retrieve token balance for user
  const tokenBalance = await getUserTokenBalance(userId)

  return (
    <ChatClientWrapper
      user={session.user}
      chats={chats}
      activeChatId={activeChatId}
      initialTokenBalance={tokenBalance}
      error={{ hasError: !success, message: error ?? '' }}
    />
  )
}
