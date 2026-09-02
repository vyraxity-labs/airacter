import { notify } from './notifications/notify'
import { NotificationChannel } from '@/generated/prisma/client'
import { sendEmail, renderVerificationEmailHtml } from './notifications/providers/email'

export { sendEmail, renderVerificationEmailHtml }

export async function sendVerificationEmail(email: string, token: string, userId?: string): Promise<boolean> {
  const result = await notify({
    userId,
    email,
    eventType: 'verification_email',
    channelPreferences: [NotificationChannel.email],
    variables: { token },
  })

  return result.success
}
