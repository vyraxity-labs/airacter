import { GoogleGenAI } from '@google/genai'

// Initialize the Google Gen AI client using the API key
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn(
    'Warning: GEMINI_API_KEY is not defined in the environment variables.',
  )
}

export const ai = new GoogleGenAI(apiKey ? { apiKey } : {})

// Recommended default model for fast, character-driven chat interactions
export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Format database message roles ("user" | "assistant") into the format expected by the Gemini API ("user" | "model")
 */
export function assembleContents(messages: ChatMessage[]) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))
}

/**
 * Call the Gemini API to get an accurate token count for a set of messages and system prompt instructions.
 */
export async function countTokens(
  messages: ChatMessage[],
  systemInstruction?: string,
  model: string = GEMINI_DEFAULT_MODEL,
): Promise<number> {
  try {
    const contents = assembleContents(messages)
    const response = await ai.models.countTokens({
      model,
      contents,
      config: systemInstruction ? { systemInstruction } : undefined,
    })

    return response.totalTokens || estimateTokens(messages, systemInstruction)
  } catch (error) {
    console.error(
      'Failed to count tokens via Gemini API, falling back to estimation:',
      error,
    )
    return estimateTokens(messages, systemInstruction)
  }
}

/**
 * Locally estimate the number of tokens in a chat payload as a fallback.
 * Uses the standard rule of thumb: 1 token ≈ 4 characters of English text.
 */
export function estimateTokens(
  messages: ChatMessage[],
  systemInstruction?: string,
): number {
  let charCount = 0

  if (systemInstruction) {
    charCount += systemInstruction.length
  }

  for (const msg of messages) {
    charCount += msg.content.length
  }

  // Count tokens based on ~4 characters per token
  return Math.max(1, Math.ceil(charCount / 4))
}

/**
 * Generate a complete (non-streamed) response from Gemini.
 * Primarily useful for one-off tasks (like auto-titling threads).
 */
export async function generateChatResponse(
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string,
  model: string = GEMINI_DEFAULT_MODEL,
) {
  const fullHistory = [
    ...history,
    { role: 'user' as const, content: userMessage },
  ]
  const contents = assembleContents(fullHistory)

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  })

  return response.text || ''
}

/**
 * Start a streaming response from Gemini.
 * Returns the Gemini response stream which resolves to an async iterable.
 */
export async function streamChatResponse(
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string,
  model: string = GEMINI_DEFAULT_MODEL,
) {
  const fullHistory = [
    ...history,
    { role: 'user' as const, content: userMessage },
  ]
  const contents = assembleContents(fullHistory)

  return ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 1500,
    },
  })
}
