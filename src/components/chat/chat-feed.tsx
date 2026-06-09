'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { marked } from 'marked'
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'

interface Character {
  id: string
  slug: string
  name: string
  description: string
  avatarType: 'emoji' | 'initials' | 'image'
  avatarValue: string
  avatarColor: string
  category: string
  tone: string[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date | string
}

interface Chat {
  id: string
  title: string | null
  characterId: string
  systemPromptSnapshot: string
  character: Character
}

interface ChatFeedProps {
  activeChat: Chat
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isLoadingMessages: boolean
  tokenBalance: number
  setTokenBalance: React.Dispatch<React.SetStateAction<number>>
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

export function ChatFeed({
  activeChat,
  messages,
  setMessages,
  isLoadingMessages,
  tokenBalance,
  setTokenBalance,
}: ChatFeedProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [imageError, setImageError] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Sync imageError when character changes
  useEffect(() => {
    setImageError(false)
  }, [activeChat.character.id])

  // Autoscroll chat history
  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, streamingMessage, isStreaming])

  // Scroll to bottom immediately on load
  useEffect(() => {
    if (!isLoadingMessages) {
      scrollToBottom('instant')
    }
  }, [isLoadingMessages, activeChat.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isStreaming || tokenBalance <= 0) return

    const userText = inputMessage.trim()
    setInputMessage('')
    setErrorMsg('')
    setIsStreaming(true)
    setStreamingMessage('')

    // Add user message locally
    const userMsgId = `temp-user-${Date.now()}`
    const userMsg: Message = { id: userMsgId, role: 'user', content: userText }
    setMessages((prev) => [...prev, userMsg])

    try {
      const response = await fetch(`/api/chats/${activeChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userText }),
      })

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error(
            'Insufficient token balance. Please recharge your tokens.',
          )
        }
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to dispatch message')
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('ReadableStream not supported')

      let currentResponseText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))

              if (data.token) {
                currentResponseText += data.token
                setStreamingMessage(currentResponseText)
              } else if (data.done) {
                // Add the finished assistant message to history
                const assistantMsg: Message = {
                  id: data.messageId,
                  role: 'assistant',
                  content: currentResponseText,
                }

                setMessages((prev) => [...prev, assistantMsg])
                setStreamingMessage('')

                // Deduct tokens
                if (data.totalTokens) {
                  setTokenBalance((prev) =>
                    Math.max(0, prev - data.totalTokens),
                  )
                }
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (err) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to generate AI response. Try again.')
    } finally {
      setIsStreaming(false)
      setStreamingMessage('')
    }
  }

  const renderMarkdown = (content: string) => {
    try {
      const rawHtml = marked.parse(content, { async: false }) as string
      const cleanHtml =
        typeof window !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml
      return { __html: cleanHtml }
    } catch (e) {
      return { __html: content }
    }
  }

  // Header Avatar Render
  const renderHeaderAvatar = () => {
    const character = activeChat.character
    if (
      character.avatarType === 'image' &&
      character.avatarValue &&
      !imageError
    ) {
      return (
        <img
          src={character.avatarValue}
          alt={character.name}
          className='w-10 h-10 rounded-xl object-cover shadow'
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
        className='w-10 h-10 rounded-xl flex items-center justify-center font-bold text-2xl'
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

  // Bubble Avatar Render
  const renderBubbleAvatar = () => {
    const character = activeChat.character
    if (
      character.avatarType === 'image' &&
      character.avatarValue &&
      !imageError
    ) {
      return (
        <img
          src={character.avatarValue}
          alt={character.name}
          className='w-8 h-8 rounded-lg object-cover shadow-sm shrink-0'
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
        className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-md font-bold font-sans shadow-sm'
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

  return (
    <div className='flex-1 flex flex-col h-full overflow-hidden bg-background'>
      {/* 1. Header Toolbar */}
      <header className='h-16 border-b border-border/40 bg-surface-lowest/40 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0'>
        <div className='flex items-center gap-3'>
          {renderHeaderAvatar()}
          <div>
            <h2 className='font-bold text-sm text-on-surface leading-none'>
              {activeChat.character.name}
            </h2>
            <div className='flex items-center gap-1.5 mt-1'>
              <span className='text-[9px] uppercase font-extrabold tracking-wider bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded'>
                {activeChat.character.category}
              </span>
              <span className='text-[9px] font-medium text-outline truncate max-w-40'>
                {activeChat.character.tone.slice(0, 2).join(' • ')}
              </span>
            </div>
          </div>
        </div>

        {/* User tokens balance indicator */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-full border text-[11px] font-extrabold tracking-wide flex items-center gap-1.5 shadow-sm backdrop-blur-sm select-none',
            tokenBalance < 5000
              ? 'bg-error/10 border-error/20 text-error animate-pulse'
              : 'bg-surface-lowest/80 border-border/30 text-on-surface',
          )}
          title={
            tokenBalance < 5000 ? 'Low token balance!' : 'Available balance'
          }
        >
          <Sparkles
            size={12}
            className={cn(
              'text-primary',
              tokenBalance >= 5000 && 'animate-pulse',
            )}
          />
          <span>{tokenBalance.toLocaleString()} TOKENS</span>
        </div>
      </header>

      {/* 2. Messages list */}
      <div
        ref={chatContainerRef}
        className='flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6'
      >
        {isLoadingMessages ? (
          <div className='h-full flex items-center justify-center flex-col gap-2'>
            <Loader2 className='text-primary animate-spin' size={24} />
            <span className='text-xs text-outline font-bold'>
              Synchronizing history...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className='h-full flex items-center justify-center flex-col gap-3 text-center max-w-md mx-auto select-none'>
            {renderHeaderAvatar()}
            <h3 className='font-bold text-on-surface text-sm mt-2'>
              This is the start of your chat with {activeChat.character.name}
            </h3>
            <p className='text-xs text-outline leading-relaxed'>
              {activeChat.character.description}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-start gap-3',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                {!isUser && renderBubbleAvatar()}

                <div
                  className={cn(
                    'p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed border shadow-inner transition-colors',
                    isUser
                      ? 'bg-gradient-to-br from-primary to-secondary text-white border-transparent rounded-tr-none'
                      : 'glass-panel text-on-surface rounded-tl-none border-border/10 markdown-content',
                  )}
                >
                  {isUser ? (
                    <p className='whitespace-pre-wrap'>{msg.content}</p>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                    />
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Live streaming message */}
        {isStreaming && streamingMessage && (
          <div className='flex items-start gap-3 justify-start'>
            {renderBubbleAvatar()}
            <div className='p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed border shadow-inner glass-panel text-on-surface rounded-tl-none border-border/10 markdown-content'>
              <div dangerouslySetInnerHTML={renderMarkdown(streamingMessage)} />
            </div>
          </div>
        )}

        {/* Thinking loader state */}
        {isStreaming && !streamingMessage && (
          <div className='flex items-start gap-3 justify-start'>
            {renderBubbleAvatar()}
            <div className='flex items-center gap-2 text-outline text-xs italic bg-surface-lowest/20 border border-border/10 rounded-2xl px-4 py-3 select-none'>
              <div className='flex gap-1.5'>
                <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce'></div>
                <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]'></div>
                <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]'></div>
              </div>
              <span>{activeChat.character.name} is formulating...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Error Banner */}
      {errorMsg && (
        <div className='px-6 py-2 bg-error/10 border-y border-error/15 text-error text-xs font-semibold flex items-center gap-2 animate-fade-in shrink-0'>
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Chat Input Panel */}
      <footer className='p-4 bg-surface-lowest/40 border-t border-border/40 backdrop-blur-md shrink-0'>
        <form
          onSubmit={handleSend}
          className='relative group max-w-4xl mx-auto'
        >
          <input
            type='text'
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              tokenBalance <= 0
                ? 'Insufficient token balance. Please recharge.'
                : `Type a message to ${activeChat.character.name}...`
            }
            disabled={isStreaming || tokenBalance <= 0}
            className='w-full bg-surface-container border border-border/20 rounded-full pl-6 pr-14 py-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-on-surface placeholder:text-outline/80 transition-all disabled:opacity-50'
          />
          <button
            type='submit'
            disabled={!inputMessage.trim() || isStreaming || tokenBalance <= 0}
            className='absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:bg-surface-container-high disabled:text-outline disabled:cursor-not-allowed disabled:scale-100'
          >
            <Send size={15} />
          </button>
        </form>
        <p className='text-[8px] text-center mt-2.5 text-outline font-extrabold uppercase tracking-widest select-none'>
          Powered by Google Gemini
        </p>
      </footer>
    </div>
  )
}
