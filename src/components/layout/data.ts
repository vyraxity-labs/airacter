import { Compass, MessageSquare, Settings, Users } from 'lucide-react'

export const getNavItems = (pathname: string) => [
  {
    label: 'Chats',
    href: '/chats',
    icon: MessageSquare,
    active: pathname.startsWith('/chats'),
  },
  {
    label: 'Roles',
    href: '/characters/my',
    icon: Users,
    active: pathname.startsWith('/characters'),
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: Compass,
    active: pathname.startsWith('/explore'),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    active: pathname.startsWith('/settings'),
  },
]
