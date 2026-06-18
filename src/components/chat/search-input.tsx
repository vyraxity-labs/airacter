import { Loader2, Search } from 'lucide-react'

const SearchInput = ({
  searchQuery,
  setSearchQuery,
  isSearching,
}: {
  searchQuery: string
  setSearchQuery: (query: string) => void
  isSearching: boolean
}) => {
  return (
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
  )
}

export default SearchInput
