import { cn } from '@/lib/utils'
import { Chat } from '@/models/chat/type'
import Link from 'next/link'
import ChatSidebarAvatar from './chat-sidebar-avatar'
import { FormEvent, MouseEvent, useState } from 'react'
import { Check, Edit2, Trash2, X } from 'lucide-react'

interface SingleChatProps {
  chat: Chat
  activeChatId: string
  onDeleteChat: (chatId: string) => Promise<void>
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>
}

const SingleChat = ({
  chat,
  activeChatId,
  onDeleteChat,
  onRenameChat,
}: SingleChatProps) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isSubmittingRename, setIsSubmittingRename] = useState(false)

  const isActive = chat.id === activeChatId
  const lastMessage = chat.messages[0]
  const isEditing = chat.id === editingChatId

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
    e: FormEvent | MouseEvent,
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
}

export default SingleChat
