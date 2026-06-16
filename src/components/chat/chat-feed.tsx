'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import { useRouter } from 'next/navigation'

// Load common Prism language components
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import { Chat } from '@/models/chat/type'
import { Message } from '@/models/message/type'
import CharacterAvatar from '../character/character-avatar'
import ChatHeader from './chat-header'
import TokenBalanceWarning from './token-balance-warning'
import { renderMarkdown } from '@/models/chat/helper'
import MessageCallout from './message-callout'

interface ChatFeedProps {
  activeChat: Chat
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isLoadingMessages: boolean
  tokenBalance: number
  setTokenBalance: React.Dispatch<React.SetStateAction<number>>
}

export function ChatFeed({
  activeChat,
  messages,
  setMessages,
  isLoadingMessages,
  tokenBalance,
  setTokenBalance,
}: ChatFeedProps) {
  const router = useRouter()
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [imageError, setImageError] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Trigger Prism highlighting on content updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Prism.highlightAll()
    }
  }, [messages, streamingMessage, isStreaming])

  // Sync imageError when character changes
  useEffect(() => {
    setImageError(false)
  }, [activeChat.character.id])

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Auto-expanding textarea height adjustments
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [inputMessage])

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

  const handleFeedback = async (msgId: string, type: 'up' | 'down') => {
    const targetMsg = messages.find((m) => m.id === msgId)
    if (!targetMsg) return

    const currentFeedback = targetMsg.feedback
    const newFeedback = currentFeedback === type ? null : type

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: newFeedback } : m)),
    )

    try {
      const response = await fetch(`/api/messages/${msgId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: newFeedback }),
      })
      if (!response.ok) throw new Error('Feedback update failed')
    } catch (err) {
      console.error('Failed to save feedback:', err)
      // Revert optimistic update on failure
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, feedback: currentFeedback } : m,
        ),
      )
    }
  }

  const handleRegenerate = async () => {
    if (isStreaming || tokenBalance <= 0) return
    setErrorMsg('')
    setIsStreaming(true)
    setStreamingMessage('')

    // Find the last user message index
    let lastUserIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i
        break
      }
    }

    if (lastUserIndex === -1) {
      setErrorMsg('No user message found to regenerate a response for.')
      setIsStreaming(false)
      return
    }

    try {
      const response = await fetch(`/api/chats/${activeChat.id}/regenerate`, {
        method: 'POST',
      })

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error(
            'Insufficient token balance. Please purchase more tokens.',
          )
        }
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to regenerate response')
      }

      // Truncate messages after that user message only after successful response
      setMessages(messages.slice(0, lastUserIndex + 1))
      router.refresh()

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('ReadableStream not supported')

      let currentResponseText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.substring(6))

              if (data.token) {
                currentResponseText += data.token
                setStreamingMessage(currentResponseText)
              } else if (data.done) {
                const assistantMsg: Message = {
                  id: data.messageId,
                  role: 'assistant',
                  content: currentResponseText,
                }
                setMessages((prev) => [...prev, assistantMsg])
                setStreamingMessage('')

                if (data.totalTokens) {
                  setTokenBalance((prev) =>
                    Math.max(0, prev - data.totalTokens),
                  )
                }
                router.refresh()
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (err) {}
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to regenerate response')
    } finally {
      setIsStreaming(false)
      setStreamingMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

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

      router.refresh()

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
                router.refresh()
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

  const lastAssistantMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return ''
  })()

  return (
    <div className='flex-1 flex flex-col h-full overflow-hidden bg-background'>
      {/* 1. Header Toolbar */}
      <ChatHeader activeChat={activeChat} tokenBalance={tokenBalance} />

      {/* Real-time Token Warning Banner */}
      {tokenBalance < 5000 && (
        <TokenBalanceWarning tokenBalance={tokenBalance} />
      )}

      {/* 2. Messages list */}
      <div
        ref={chatContainerRef}
        className='grow overflow-y-auto custom-scrollbar p-6 space-y-6'
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
            <CharacterAvatar char={activeChat.character} />
            <h3 className='font-bold text-on-surface text-sm mt-2'>
              This is the start of your chat with {activeChat.character.name}
            </h3>
            <p className='text-xs text-outline leading-relaxed'>
              {activeChat.character.description}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            return (
              <MessageCallout
                msg={msg}
                activeChat={activeChat}
                lastAssistantMessageId={lastAssistantMessageId}
                isStreaming={isStreaming}
                handleFeedback={handleFeedback}
                handleRegenerate={handleRegenerate}
              />
            )
          })
        )}

        {/* Live streaming message */}
        {isStreaming && streamingMessage && (
          <div className='flex items-start gap-3 justify-start min-w-0'>
            <CharacterAvatar char={activeChat.character} size='small' />
            <div className='flex flex-col items-start max-w-[80%] min-w-0'>
              <div className='p-4 rounded-2xl max-w-full overflow-hidden text-sm leading-relaxed border shadow-inner glass-panel text-on-surface rounded-tl-none border-border/10 markdown-content'>
                <div
                  dangerouslySetInnerHTML={renderMarkdown(streamingMessage)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Thinking loader state */}
        {isStreaming && !streamingMessage && (
          <div className='flex items-start gap-3 justify-start min-w-0'>
            <CharacterAvatar char={activeChat.character} size='small' />
            <div className='flex flex-col items-start max-w-[80%] min-w-0'>
              <div className='flex items-center gap-2 text-outline text-xs italic bg-surface-lowest/20 border border-border/10 rounded-2xl px-4 py-3 select-none'>
                <div className='flex gap-1.5'>
                  <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce'></div>
                  <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]'></div>
                  <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]'></div>
                </div>
                <span>{activeChat.character.name} is formulating...</span>
              </div>
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
      <footer className='p-4 bg-transparent shrink-0 relative z-10'>
        <form onSubmit={handleSend} className='max-w-4xl mx-auto'>
          <div className='relative flex flex-col w-full bg-surface-container/60 border border-border/20 rounded-[28px] p-2 backdrop-blur-lg shadow-ambient group focus-within:border-primary/30 transition-all'>
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                tokenBalance <= 0
                  ? 'Insufficient token balance. Please recharge.'
                  : `Message ${activeChat.character.name}...`
              }
              disabled={isStreaming || tokenBalance <= 0}
              className='w-full bg-transparent text-xs text-on-surface focus:outline-none resize-none px-4 pt-3 pb-2 max-h-40 min-h-[38px] placeholder:text-outline/70 disabled:opacity-50'
            />
            <div className='flex items-center justify-between pt-2 border-t border-border/10 px-4 pb-1'>
              <div className='flex items-center gap-2'>
                {inputMessage.trim() && (
                  <span className='px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-primary/10 border border-primary/20 text-primary animate-fade-in'>
                    ~{Math.max(1, Math.ceil(inputMessage.length / 4))} TOKENS
                    ESTIMATE
                  </span>
                )}
              </div>
              <button
                type='submit'
                disabled={
                  !inputMessage.trim() || isStreaming || tokenBalance <= 0
                }
                className='w-8 h-8 rounded-full bg-primary text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:bg-surface-container-high disabled:text-outline disabled:cursor-not-allowed disabled:scale-100'
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </form>
        <p className='text-[8px] text-center mt-2.5 text-outline font-extrabold uppercase tracking-widest select-none'>
          Powered by Google Gemini
        </p>
      </footer>
    </div>
  )
}
