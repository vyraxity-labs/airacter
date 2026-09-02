import { notify } from './notifications/notify'
import { NotificationChannel } from '@/generated/prisma/client'
import { sendEmail, renderVerificationEmailHtml } from './notifications/providers/email'

export { sendEmail, renderVerificationEmailHtml }

export async function sendVerificationEmail(
  email: string,
  token: string,
  userId?: string
): Promise<boolean> {
  const channelPreferences: NotificationChannel[] = [NotificationChannel.email]
  if (userId) {
    channelPreferences.push(NotificationChannel.in_app)
  }

  const result = await notify({
    userId,
    email,
    eventType: 'verification_email',
    channelPreferences,
    variables: {
      token,
      title: 'Verify your email - Airacter',
      body: 'Please verify your email address to activate your account and claim your welcome tokens.',
    },
  })

  return result.success
}
