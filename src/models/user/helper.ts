export const getInitials = (name: string): string => {
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
