'use client'

import { useState, useEffect } from 'react'
import { Compass } from 'lucide-react'
import SearchInput from './search-input'
import EmptyErrorUI from './empty-error-ui'
import { Chat } from '@/models/chat/type'
import SingleChat from './single-chat'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/client'

interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string
  onDeleteChat: (chatId: string) => Promise<void>
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>
  errorMessage?: string
}

export function ChatSidebar({
  chats,
  activeChatId,
  onDeleteChat,
  onRenameChat,
  errorMessage,
}: ChatSidebarProps) {
  const { t } = useTranslation('chat')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayChats, setDisplayChats] = useState<Chat[]>(chats)
  const [isSearching, setIsSearching] = useState(false)

  // Sync displayChats and handle debounced server-side search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDisplayChats(chats)
      return
    }

    let active = true

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          '/api/chats?q=' + encodeURIComponent(searchQuery),
        )
        if (res.ok && active) {
          const data = await res.json()
          setDisplayChats(data.chats || [])
        }
      } catch (err) {
        if (active) {
          console.error('Failed to search chats:', err)
        }
      } finally {
        if (active) {
          setIsSearching(false)
        }
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, chats])

  // Group chats chronologically
  const groupChats = () => {
    const groups: Record<string, Chat[]> = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    displayChats.forEach((chat) => {
      const date = new Date(chat.updatedAt)
      if (date >= today) {
        groups.Today.push(chat)
      } else if (date >= yesterday) {
        groups.Yesterday.push(chat)
      } else if (date >= sevenDaysAgo) {
        groups['Last 7 Days'].push(chat)
      } else {
        groups.Older.push(chat)
      }
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }

  const chatGroups = groupChats()

  return (
    <div className='flex flex-col h-full bg-surface-lowest/40 backdrop-blur-md select-none'>
      {/* 1. Header Area */}
      <div className='p-4 border-b border-border/40 flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <span className='font-bold text-sm text-on-surface'>
            {t('sidebar.conversations')}
          </span>
          <Link
            href='/explore'
            className='p-1.5 rounded-lg border border-border/30 bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary-container transition-colors flex items-center gap-1 text-[11px] font-bold'
          >
            <Compass size={12} />
            {t('sidebar.new_chat')}
          </Link>
        </div>

        {/* Search Input Bar */}
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
        />
      </div>

      {/* 2. Chronological Chats List */}
      <div
        className='grow overflow-y-auto custom-scrollbar p-2 space-y-4'
        suppressHydrationWarning
      >
        {chatGroups.length === 0 ? (
          <EmptyErrorUI errorMessage={errorMessage} />
        ) : (
          chatGroups.map(([groupName, items]) => (
            <div key={groupName} className='space-y-1' suppressHydrationWarning>
              <span
                className='block text-[9px] uppercase font-extrabold tracking-widest text-outline px-3 mb-1.5'
                suppressHydrationWarning
              >
                {t(
                  `sidebar.group.group_${groupName.toLowerCase().replace(/ /g, '_')}`,
                )}
              </span>

              <div className='space-y-1'>
                {items.map((chat) => {
                  return (
                    <SingleChat
                      key={chat.id}
                      chat={chat}
                      activeChatId={activeChatId}
                      onDeleteChat={onDeleteChat}
                      onRenameChat={onRenameChat}
                    />
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
