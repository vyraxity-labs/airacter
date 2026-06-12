import { User } from '@/models/user/types'

const UserAvatar = ({ user }: { user?: User }) => {
  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name || 'User Profile'}
        className='w-8 h-8 rounded-full border-2 border-primary object-cover'
      />
    )
  }

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className='w-8 h-8 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-sans'>
      {initials}
    </div>
  )
}

export default UserAvatar
