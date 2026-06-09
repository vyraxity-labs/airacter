import { generateChatResponse } from './ai-gateway'
import { db } from './db'

/**
 * Summarizes the first message in a chat session using Gemini to auto-title the thread.
 */
export async function autoTitleChat(chatId: string, firstMessageContent: string) {
  try {
    const prompt = `You are a helpful assistant. Summarize the following user message into a short, concise chat conversation title.
Requirements:
- Maximum of 4-5 words.
- Do NOT use punctuation or quotes.
- Do NOT use filler words.
- Focus on the main topic of the message.

Message: ${firstMessageContent}`

    // Call Gemini with the summarization prompt
    const titleRaw = await generateChatResponse(
      "You are a helpful summarizer.",
      [],
      prompt
    )

    let title = titleRaw.trim()
    
    // Clean up surrounding quotes, trailing periods, etc.
    title = title.replace(/^["']|["']$/g, '').replace(/\.$/, '').trim()

    if (title && title.length <= 100) {
      await db.chat.update({
        where: { id: chatId },
        data: { title },
      })
      console.log(`[Auto-Title] Successfully auto-titled chat ${chatId} to: "${title}"`)
    }
  } catch (error) {
    console.error(`[Auto-Title] Failed to auto-title chat ${chatId}:`, error)
  }
}
