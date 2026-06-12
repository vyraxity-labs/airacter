export const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}
