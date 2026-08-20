'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { ChatSidebar } from './chat-sidebar'
import { ChatFeed } from './chat-feed'
import { MessageSquare } from 'lucide-react'
import { Chat } from '@/models/chat/type'
import { Message } from '@/models/message/type'
import { useTranslation } from '@/lib/i18n/client'

interface ChatClientWrapperProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  chats: Chat[]
  activeChatId: string
  initialTokenBalance: number
  error: {
    hasError: boolean
    message: string
  }
}

export function ChatClientWrapper({
  user,
  chats,
  activeChatId,
  initialTokenBalance,
  error = { hasError: false, message: '' },
}: ChatClientWrapperProps) {
  const router = useRouter()
  const [tokenBalance, setTokenBalance] = useState(initialTokenBalance)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const { t } = useTranslation('chat')

  const activeChat = chats.find((c) => c.id === activeChatId)

  // Sync token balance from props when page reloads/refreshes
  useEffect(() => {
    setTokenBalance(initialTokenBalance)
  }, [initialTokenBalance])

  // Load message history on active chat selection change
  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }

    setIsLoadingMessages(true)
    fetch(`/api/chats/${activeChatId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(t('error.load_failed'))
        return res.json()
      })
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages)
        }
      })
      .catch((err) => {
        console.error('GET /api/chats/[id]/messages error:', err)
      })
      .finally(() => {
        setIsLoadingMessages(false)
      })
  }, [activeChatId])

  // Handle chat thread deletion
  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('error.delete_failed'))
      }

      router.refresh()
      if (activeChatId === chatId) {
        router.push('/chats')
      }
    } catch (err) {
      console.error('Delete chat error:', err)
      alert(t('error.thread_delete_failed'))
    }
  }

  // Handle chat thread title update
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })

      if (!response.ok) {
        throw new Error(t('error.update_failed'))
      }

      router.refresh()
    } catch (err) {
      console.error('Rename chat error:', err)
      alert(t('error.chat_rename_failed'))
    }
  }

  return (
    <DashboardShell
      user={user}
      sidebar={
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          errorMessage={error.message}
        />
      }
    >
      {activeChat ? (
        <ChatFeed
          activeChat={activeChat}
          messages={messages}
          setMessages={setMessages}
          isLoadingMessages={isLoadingMessages}
          tokenBalance={tokenBalance}
          setTokenBalance={setTokenBalance}
        />
      ) : (
        <div className='grow flex flex-col items-center justify-center p-8 text-center select-none bg-background relative'>
          {/* Ambient visual background glow effects */}
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none' />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none' />

          <div className='max-w-md p-8 rounded-[24px] border border-border/20 bg-surface-lowest/40 backdrop-blur-md flex flex-col items-center gap-4 shadow-ambient'>
            <div className='w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-pulse'>
              <MessageSquare size={26} />
            </div>
            <h3 className='text-lg font-bold text-on-surface'>
              {t('main.states.empty_conversation')}
            </h3>
            <p className='text-xs text-outline leading-relaxed'>
              {t('main.states.empty_conversation_desc')}
            </p>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
