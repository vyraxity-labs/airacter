import { BrevoClient } from '@getbrevo/brevo'
import { getRequiredEnv } from '@/lib/env'
import { STARTING_TOKEN } from '@/lib/constants'

const getBrevoClient = () => {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    // Fall back to console logging during development if credentials are empty
    return null
  }

  return new BrevoClient({ apiKey })
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const client = getBrevoClient()
  const from = getRequiredEnv('SMTP_FROM')

  if (!client) {
    console.log('=========================================')
    console.log(`[Email Provider (Dev/Fallback)] TO: ${to}`)
    console.log(`SUBJECT: ${subject}`)
    console.log(`HTML BODY:\n${html}`)
    console.log('=========================================')
    return true
  }

  try {
    await client.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: {
        name: 'Airacter',
        email: from,
      },
      to: [
        {
          email: to,
        },
      ],
    })
    return true
  } catch (error) {
    console.error('Failed to send email via Brevo:', error)
    throw new Error('Failed to send email. Please try again later.')
  }
}

export function renderVerificationEmailHtml(token: string): { subject: string; html: string } {
  const appDomain = getRequiredEnv('NEXT_PUBLIC_APP_URL')
  const verificationLink = `${appDomain}/auth/verify?token=${token}`
  const subject = 'Verify your email - Airacter'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0ea5e9; text-align: center;">Welcome to Airacter</h2>
      <p>Thank you for registering. Please click the button below to verify your email address and activate your account. You will receive ${STARTING_TOKEN} free tokens upon verification!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        If the button above does not work, copy and paste this link into your browser: <br/>
        <a href="${verificationLink}" style="color: #0ea5e9;">${verificationLink}</a>
      </p>
      <p style="font-size: 12px; color: #64748b;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `

  return { subject, html }
}
