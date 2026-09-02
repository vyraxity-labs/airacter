import { db } from '@/lib/db'
import { NotificationChannel } from '@/generated/prisma/client'
import {
  sendEmail,
  renderVerificationEmailHtml,
} from './providers/email'

export interface NotifyOptions {
  userId?: string
  email?: string
  eventType: string
  channelPreferences?: NotificationChannel[]
  variables?: Record<string, any>
  template?: {
    subject?: string
    html?: string
    text?: string
  }
}

export interface NotifyResult {
  success: boolean
  deliveredChannels: NotificationChannel[]
  skippedChannels: NotificationChannel[]
}

// Transactional event types that must always deliver regardless of preference toggles
const MANDATORY_TRANSACTIONAL_EVENTS = new Set([
  'verification_email',
  'password_reset',
])

export async function notify(options: NotifyOptions): Promise<NotifyResult> {
  const {
    userId,
    email,
    eventType,
    channelPreferences = [NotificationChannel.email],
    variables = {},
    template,
  } = options

  const deliveredChannels: NotificationChannel[] = []
  const skippedChannels: NotificationChannel[] = []

  // Resolve recipient email if not directly provided
  let recipientEmail = email
  if (!recipientEmail && userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    recipientEmail = user?.email || undefined
  }

  for (const channel of channelPreferences) {
    // Check notification preferences if userId is known and event is not mandatory
    if (userId && !MANDATORY_TRANSACTIONAL_EVENTS.has(eventType)) {
      const pref = await db.notificationPreference.findUnique({
        where: {
          userId_eventType_channel: {
            userId,
            eventType,
            channel,
          },
        },
      })

      if (pref && !pref.enabled) {
        skippedChannels.push(channel)
        continue
      }
    }

    // Channel Dispatch
    try {
      if (channel === NotificationChannel.email) {
        if (!recipientEmail) {
          console.warn(`[notify] Cannot send email for event "${eventType}": no email address found.`)
          skippedChannels.push(channel)
          continue
        }

        let subject = template?.subject || `Notification: ${eventType}`
        let html = template?.html || `<p>${eventType}</p>`

        if (eventType === 'verification_email') {
          const rendered = renderVerificationEmailHtml(variables.token || '')
          subject = rendered.subject
          html = rendered.html
        }

        await sendEmail({
          to: recipientEmail,
          subject,
          html,
          text: template?.text,
        })
        deliveredChannels.push(channel)
      } else if (channel === NotificationChannel.in_app) {
        if (!userId) {
          console.warn(`[notify] Cannot create in_app notification for event "${eventType}": no userId provided.`)
          skippedChannels.push(channel)
          continue
        }

        const title = template?.subject || variables.title || `Notification: ${eventType}`
        const body = template?.text || template?.html || variables.body || variables.message || eventType

        await db.notification.create({
          data: {
            userId,
            eventType,
            title,
            body,
          },
        })
        deliveredChannels.push(channel)
      } else {
        // SMS, Push channels (future extensions)
        console.log(`[notify] Channel ${channel} queued for event ${eventType}`)
        deliveredChannels.push(channel)
      }
    } catch (err) {
      console.error(`[notify] Failed to dispatch to channel ${channel}:`, err)
      skippedChannels.push(channel)
    }
  }

  return {
    success: deliveredChannels.length > 0,
    deliveredChannels,
    skippedChannels,
  }
}
