'use client'

import { Chat } from '@/models/chat/type'
import { Message } from '@/models/message/type'
import { Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react'

interface ChatInputFormProps {
  isStreaming: boolean
  setIsStreaming: (value: boolean) => void
  tokenBalance: number
  inputMessage: string
  setInputMessage: (value: string) => void
  setErrorMsg: (value: string) => void
  setStreamingMessage: (value: string) => void
  setTokenBalance: Dispatch<SetStateAction<number>>
  setMessages: Dispatch<SetStateAction<Message[]>>
  activeChat: Chat
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

const ChatInputForm = ({
  isStreaming,
  tokenBalance,
  inputMessage,
  setInputMessage,
  setErrorMsg,
  setIsStreaming,
  setStreamingMessage,
  setMessages,
  activeChat,
  setTokenBalance,
  textareaRef,
}: ChatInputFormProps) => {
  const router = useRouter()

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

  return (
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
  )
}

export default ChatInputForm
