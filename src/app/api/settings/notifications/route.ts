import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const channelEnum = z.enum(['email', 'sms', 'push', 'in_app'])

const preferenceItemSchema = z.object({
  eventType: z.string().min(1).max(100),
  channel: channelEnum.default('email'),
  enabled: z.boolean(),
})

const patchBodySchema = z.union([
  preferenceItemSchema,
  z.array(preferenceItemSchema),
  z.object({
    preferences: z.array(preferenceItemSchema),
  }),
])

const DEFAULT_PREFERENCES = [
  { eventType: 'newsletter', channel: 'email' as const, enabled: true },
  { eventType: 'weekly_digest', channel: 'email' as const, enabled: false },
  { eventType: 'security_alerts', channel: 'email' as const, enabled: true },
  { eventType: 'token_milestones', channel: 'in_app' as const, enabled: true },
  { eventType: 'low_token_warnings', channel: 'email' as const, enabled: true },
]

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let preferences = await db.notificationPreference.findMany({
      where: { userId },
      orderBy: { eventType: 'asc' },
    })

    // Seed defaults if user has no preferences recorded yet
    if (preferences.length === 0) {
      await db.notificationPreference.createMany({
        data: DEFAULT_PREFERENCES.map((pref) => ({
          userId,
          eventType: pref.eventType,
          channel: pref.channel,
          enabled: pref.enabled,
        })),
        skipDuplicates: true,
      })

      preferences = await db.notificationPreference.findMany({
        where: { userId },
        orderBy: { eventType: 'asc' },
      })
    }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error: any) {
    console.error('Failed to fetch notification preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification preferences' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await request.json()
    const parsed = patchBodySchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    let itemsToUpdate: z.infer<typeof preferenceItemSchema>[] = []

    if (Array.isArray(parsed.data)) {
      itemsToUpdate = parsed.data
    } else if ('preferences' in parsed.data) {
      itemsToUpdate = parsed.data.preferences
    } else {
      itemsToUpdate = [parsed.data]
    }

    // Upsert each preference row
    await Promise.all(
      itemsToUpdate.map((item) =>
        db.notificationPreference.upsert({
          where: {
            userId_eventType_channel: {
              userId,
              eventType: item.eventType,
              channel: item.channel,
            },
          },
          create: {
            userId,
            eventType: item.eventType,
            channel: item.channel,
            enabled: item.enabled,
          },
          update: {
            enabled: item.enabled,
          },
        }),
      ),
    )

    const updatedPreferences = await db.notificationPreference.findMany({
      where: { userId },
      orderBy: { eventType: 'asc' },
    })

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    })
  } catch (error: any) {
    console.error('Failed to update notification preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification preferences' },
      { status: 500 },
    )
  }
}
