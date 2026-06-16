import { marked } from 'marked'
import DOMPurify from 'dompurify'

export const renderMarkdown = (content: string) => {
  try {
    const rawHtml = marked.parse(content, { async: false }) as string
    const cleanHtml =
      typeof window !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml
    return { __html: cleanHtml }
  } catch (e) {
    return { __html: content }
  }
}
