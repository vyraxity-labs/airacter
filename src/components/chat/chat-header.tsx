import { cn } from '@/lib/utils'
import CharacterAvatar from '../character/character-avatar'
import { Chat } from '@/models/chat/type'
import { Sparkles } from 'lucide-react'

const ChatHeader = ({
  activeChat,
  tokenBalance,
}: {
  activeChat: Chat
  tokenBalance: number
}) => {
  return (
    <header className='h-16 border-b border-border/40 bg-surface-lowest/40 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0 sticky top-0'>
      <div className='flex items-center gap-3'>
        <CharacterAvatar char={activeChat.character} />
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
        title={tokenBalance < 5000 ? 'Low token balance!' : 'Available balance'}
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
  )
}

export default ChatHeader
