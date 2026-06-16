'use client'

import { Message } from '@/models/message/type'
import CharacterAvatar from '../character/character-avatar'
import { Chat } from '@/models/chat/type'
import { cn } from '@/lib/utils'
import {
  Copy,
  Volume2,
  Square,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react'
import { renderMarkdown } from '@/models/chat/helper'
import { useRef, useState } from 'react'

interface MessageCalloutProps {
  msg: Message
  activeChat: Chat
  lastAssistantMessageId: string
  isStreaming: boolean
  handleFeedback: (msgId: string, type: 'up' | 'down') => void
  handleRegenerate: () => Promise<void>
}

const MessageCallout = ({
  msg,
  activeChat,
  lastAssistantMessageId,
  isStreaming,
  handleFeedback,
  handleRegenerate,
}: MessageCalloutProps) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isUser = msg.role === 'user'

  const handleCopyMarkdown = (msgId: string, content: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedMessageId(msgId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      })
      .catch((err) => console.error('Failed to copy text:', err))
  }

  const handleReadAloud = (msgId: string, content: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (activeSpeechId === msgId) {
      window.speechSynthesis.cancel()
      setActiveSpeechId(null)
      return
    }

    window.speechSynthesis.cancel()

    // Clean markdown formatting before speaking
    const cleanText = content.replace(/[*_#`~>\[\]()\-+]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utteranceRef.current = utterance

    utterance.onend = () => {
      setActiveSpeechId(null)
      utteranceRef.current = null
    }
    utterance.onerror = () => {
      setActiveSpeechId(null)
      utteranceRef.current = null
    }

    setActiveSpeechId(msgId)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div
      key={msg.id}
      className={cn(
        'flex items-start gap-3 group/msg',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && <CharacterAvatar char={activeChat.character} size='small' />}

      <div className='flex flex-col items-start max-w-[80%] min-w-0'>
        <div
          className={cn(
            'p-4 rounded-2xl text-sm leading-relaxed border shadow-inner transition-colors max-w-full overflow-hidden',
            isUser
              ? 'bg-linear-to-br from-primary to-secondary text-white border-transparent rounded-tr-none'
              : 'glass-panel text-on-surface rounded-tl-none border-border/10 markdown-content',
          )}
        >
          {isUser ? (
            <p className='whitespace-pre-wrap'>{msg.content}</p>
          ) : (
            <div dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
          )}
        </div>

        {!isUser && (
          <div className='flex items-center gap-3 mt-1.5 ml-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 text-outline'>
            <button
              onClick={() => handleCopyMarkdown(msg.id, msg.content)}
              className='hover:text-primary transition-colors duration-150'
              title={copiedMessageId === msg.id ? 'Copied!' : 'Copy Markdown'}
            >
              {copiedMessageId === msg.id ? (
                <Check size={13} className='text-emerald-500' />
              ) : (
                <Copy size={13} />
              )}
            </button>
            <button
              onClick={() => handleReadAloud(msg.id, msg.content)}
              className={cn(
                'hover:text-primary transition-colors duration-150',
                activeSpeechId === msg.id ? 'text-primary animate-pulse' : '',
              )}
              title={activeSpeechId === msg.id ? 'Stop Reading' : 'Read Aloud'}
            >
              {activeSpeechId === msg.id ? (
                <Square size={13} className='fill-current' />
              ) : (
                <Volume2 size={13} />
              )}
            </button>
            {msg.id === lastAssistantMessageId && (
              <button
                onClick={handleRegenerate}
                disabled={isStreaming}
                className='hover:text-primary transition-colors duration-150 disabled:opacity-50'
                title='Regenerate Response'
              >
                <RefreshCw
                  size={13}
                  className={cn(isStreaming && 'animate-spin')}
                />
              </button>
            )}
            <button
              onClick={() => handleFeedback(msg.id, 'up')}
              className={cn(
                'hover:text-emerald-500 transition-colors duration-150',
                msg.feedback === 'up' ? 'text-emerald-500' : '',
              )}
              title='Thumbs Up'
            >
              <ThumbsUp
                size={13}
                className={cn(msg.feedback === 'up' && 'fill-current')}
              />
            </button>
            <button
              onClick={() => handleFeedback(msg.id, 'down')}
              className={cn(
                'hover:text-rose-500 transition-colors duration-150',
                msg.feedback === 'down' ? 'text-rose-500' : '',
              )}
              title='Thumbs Down'
            >
              <ThumbsDown
                size={13}
                className={cn(msg.feedback === 'down' && 'fill-current')}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageCallout
