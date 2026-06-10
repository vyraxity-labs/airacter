'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Compass,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Character {
  id: string
  slug: string
  name: string
  avatarType: 'emoji' | 'initials' | 'image'
  avatarValue: string
  avatarColor: string
  category: string
}

interface Chat {
  id: string
  title: string | null
  userId: string
  characterId: string
  updatedAt: Date | string
  character: Character
  messages: Array<{
    role: string
    content: string
    createdAt: Date | string
  }>
}

interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string
  onDeleteChat: (chatId: string) => Promise<void>
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>
}

function getInitials(name: string): string {
  if (!name.trim()) return 'AI'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return words
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase()
}

export function ChatSidebar({
  chats,
  activeChatId,
  onDeleteChat,
  onRenameChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isSubmittingRename, setIsSubmittingRename] = useState(false)
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

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingChatId(chat.id)
    setRenameValue(chat.title || chat.character.name)
  }

  const handleCancelRename = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingChatId(null)
    setRenameValue('')
  }

  const handleSaveRename = async (
    e: React.FormEvent | React.MouseEvent,
    chatId: string,
  ) => {
    if (e.type === 'submit') {
      e.preventDefault()
    }
    e.stopPropagation()

    if (!renameValue.trim() || isSubmittingRename) return

    setIsSubmittingRename(true)
    try {
      await onRenameChat(chatId, renameValue.trim())
      setEditingChatId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingRename(false)
    }
  }

  const handleDeleteClick = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (
      confirm(
        'Are you sure you want to delete this chat session? All messages will be lost.',
      )
    ) {
      try {
        await onDeleteChat(chatId)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const chatGroups = groupChats()

  return (
    <div className='flex flex-col h-full bg-surface-lowest/40 backdrop-blur-md select-none'>
      {/* 1. Header Area */}
      <div className='p-4 border-b border-border/40 flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <span className='font-bold text-sm text-on-surface'>
            Conversations
          </span>
          <Link
            href='/explore'
            className='p-1.5 rounded-lg border border-border/30 bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary-container transition-colors flex items-center gap-1 text-[11px] font-bold'
          >
            <Compass size={12} />
            New
          </Link>
        </div>

        {/* Search Input Bar */}
        <div className='relative group'>
          {isSearching ? (
            <Loader2
              className='absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin'
              size={14}
            />
          ) : (
            <Search
              className='absolute left-3 top-1/2 -translate-y-1/2 text-outline/80 group-hover:text-primary transition-colors'
              size={14}
            />
          )}
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search chats...'
            className='w-full bg-surface-container/80 border border-border/20 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-on-surface placeholder:text-outline transition-all'
          />
        </div>
      </div>

      {/* 2. Chronological Chats List */}
      <div className='flex-grow overflow-y-auto custom-scrollbar p-2 space-y-4' suppressHydrationWarning>
        {chatGroups.length === 0 ? (
          <div className='py-12 px-4 text-center'>
            <MessageSquare
              className='mx-auto text-outline/40 mb-3 stroke-[1.5px]'
              size={32}
            />
            <p className='text-xs font-semibold text-on-surface-variant'>
              No active conversations
            </p>
            <p className='text-[10px] text-outline mt-1 leading-relaxed'>
              Explore characters and start talking to one to begin!
            </p>
          </div>
        ) : (
          chatGroups.map(([groupName, items]) => (
            <div key={groupName} className='space-y-1' suppressHydrationWarning>
              <span className='block text-[9px] uppercase font-extrabold tracking-widest text-outline px-3 mb-1.5' suppressHydrationWarning>
                {groupName}
              </span>

              <div className='space-y-1'>
                {items.map((chat) => {
                  const isActive = chat.id === activeChatId
                  const lastMessage = chat.messages[0]
                  const isEditing = chat.id === editingChatId

                  return (
                    <Link
                      key={chat.id}
                      href={`/chats?chat=${chat.id}`}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all group relative border border-transparent',
                        isActive
                          ? 'bg-primary-container/20 border-primary/20 text-primary active-glow shadow-glow-primary'
                          : 'text-on-surface-variant',
                      )}
                    >
                      {/* Avatar */}
                      <ChatSidebarAvatar character={chat.character} />

                      {/* Chat Title / Last Message text */}
                      <div className='flex-1 min-w-0 pr-10'>
                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(e, chat.id)}
                            className='flex items-center gap-1'
                          >
                            <input
                              type='text'
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className='w-full bg-surface-container-high border border-primary text-xs rounded px-1.5 py-0.5 focus:outline-none text-on-surface'
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type='button'
                              onClick={(e) => handleSaveRename(e, chat.id)}
                              disabled={isSubmittingRename}
                              className='p-1 bg-primary text-white rounded hover:bg-primary-container transition-colors cursor-pointer'
                            >
                              <Check size={10} />
                            </button>
                            <button
                              type='button'
                              onClick={handleCancelRename}
                              className='p-1 border border-border bg-surface-container rounded hover:text-on-surface transition-colors cursor-pointer'
                            >
                              <X size={10} />
                            </button>
                          </form>
                        ) : (
                          <>
                            <h4 className='font-bold text-xs truncate text-on-surface group-hover:text-primary transition-colors'>
                              {chat.title || chat.character.name}
                            </h4>
                            <p className='text-[10px] text-outline truncate leading-normal mt-0.5'>
                              {lastMessage
                                ? (lastMessage.role === 'user' ? 'You: ' : '') +
                                  lastMessage.content
                                : 'No messages yet'}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Hover action controls */}
                      {!isEditing && (
                        <div className='absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10'>
                          <button
                            onClick={(e) => handleStartRename(e, chat)}
                            className='p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer'
                            title='Rename chat'
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, chat.id)}
                            className='p-1 rounded text-outline hover:text-error hover:bg-error/15 transition-all cursor-pointer'
                            title='Delete chat'
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </Link>
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

// Sub-component to handle Sidebar Avatar broken image fallbacks
function ChatSidebarAvatar({ character }: { character: Character }) {
  const [imageError, setImageError] = useState(false)

  if (
    character.avatarType === 'image' &&
    character.avatarValue &&
    !imageError
  ) {
    return (
      <img
        src={character.avatarValue}
        alt={character.name}
        className='w-9 h-9 rounded-xl object-cover shadow-inner shrink-0'
        onError={() => setImageError(true)}
      />
    )
  }

  const fallbackText =
    character.avatarType === 'emoji'
      ? character.avatarValue
      : getInitials(character.name)

  return (
    <div
      className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold font-sans shadow-inner select-none'
      style={{
        background: `linear-gradient(135deg, ${character.avatarColor}15 0%, ${character.avatarColor}30 100%)`,
        border: `1px solid ${character.avatarColor}20`,
        color: character.avatarColor,
      }}
    >
      <span className='scale-90'>{fallbackText}</span>
    </div>
  )
}
