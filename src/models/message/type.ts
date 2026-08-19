export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  feedback?: 'up' | 'down' | null
  createdAt?: Date | string
}
