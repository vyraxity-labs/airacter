import { TrendingCharacter } from '@/models/character/types'
import Link from 'next/link'

interface TrendingCardProps {
  char: TrendingCharacter
}

const TrendingCard = ({ char }: TrendingCardProps) => {
  return (
    <Link
      href={`/chats?character=${char.slug}`}
      key={char.id}
      className='relative h-64 rounded-[24px] overflow-hidden group cursor-pointer border border-border/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(137,206,255,0.2)] transition-all duration-500'
    >
      {char.avatarType === 'image' && char.avatarValue ? (
        <img
          src={char.avatarValue}
          alt={char.name}
          className='absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
        />
      ) : (
        <div
          className='absolute inset-0 w-full h-full flex items-center justify-center text-8xl'
          style={{
            background: `linear-gradient(135deg, ${char.avatarColor}40 0%, ${char.avatarColor}70 100%)`,
          }}
        >
          <span className='transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500'>
            {char.avatarValue}
          </span>
        </div>
      )}
      <div className='absolute inset-0 bg-linear-to-t from-background/95 via-background/40 to-transparent'></div>
      <div className='absolute bottom-0 p-6 w-full flex flex-col items-start'>
        <span className='bg-tertiary/20 text-tertiary text-[10px] font-bold px-3 py-1 rounded-full border border-tertiary/10 backdrop-blur-md mb-2.5 uppercase tracking-wider'>
          {char.category}
        </span>
        <h3 className='text-xl font-bold text-white mb-1 drop-shadow-sm group-hover:text-primary transition-colors'>
          {char.name}
        </h3>
        <p className='text-on-surface-variant text-xs line-clamp-1 max-w-[95%]'>
          {char.description}
        </p>
      </div>
    </Link>
  )
}

export default TrendingCard
