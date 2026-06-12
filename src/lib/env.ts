export const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim()
  if (!value) {
    if (process.env.NEXT_PHASE?.includes('build')) {
      return ''
    }
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}
