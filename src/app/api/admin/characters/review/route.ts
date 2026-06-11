import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reviewSchema = z.object({
  characterId: z.string(),
  action: z.enum(['approve', 'reject', 'dismiss_report', 'resolve_report']),
  reportId: z.string().optional(),
  reason: z.string().optional(),
})

const featureSchema = z.object({
  characterId: z.string(),
  isFeatured: z.boolean(),
})

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admins only' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const result = reviewSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const { characterId, action, reportId, reason } = result.data

    if (action === 'approve') {
      // Approve character: Verify it, and dismiss pending reports
      await db.$transaction([
        db.character.update({
          where: { id: characterId },
          data: { isVerified: true },
        }),
        db.characterReport.updateMany({
          where: { characterId, status: 'pending' },
          data: { status: 'dismissed' },
        }),
      ])
    } else if (action === 'reject') {
      // Reject character: Set to private, remove verification, create system rejection log, resolve pending reports
      const rejectReason =
        reason?.trim() || 'Does not meet community standards.'
      await db.$transaction([
        db.character.update({
          where: { id: characterId },
          data: { visibility: 'private', isVerified: false },
        }),
        db.characterReport.create({
          data: {
            characterId,
            reportedBy: userId,
            category: 'other',
            notes: `REJECTED: ${rejectReason}`,
            status: 'resolved',
          },
        }),
        db.characterReport.updateMany({
          where: { characterId, status: 'pending' },
          data: { status: 'resolved' },
        }),
      ])
    } else if (action === 'dismiss_report') {
      if (!reportId) {
        return NextResponse.json(
          { error: 'reportId is required for dismiss_report action' },
          { status: 400 },
        )
      }
      const report = await db.characterReport.findUnique({
        where: { id: reportId },
      })
      if (!report || report.characterId !== characterId) {
        return NextResponse.json(
          { error: 'Report not found or does not belong to this character' },
          { status: 400 },
        )
      }
      await db.characterReport.update({
        where: { id: reportId },
        data: { status: 'dismissed' },
      })
    } else if (action === 'resolve_report') {
      if (!reportId) {
        return NextResponse.json(
          { error: 'reportId is required for resolve_report action' },
          { status: 400 },
        )
      }
      const report = await db.characterReport.findUnique({
        where: { id: reportId },
      })
      if (!report || report.characterId !== characterId) {
        return NextResponse.json(
          { error: 'Report not found or does not belong to this character' },
          { status: 400 },
        )
      }

      const rejectReason =
        reason?.trim() || 'Report resolved. Content restricted.'
      // Set character private, mark reports as resolved
      await db.$transaction([
        db.character.update({
          where: { id: characterId },
          data: { visibility: 'private', isVerified: false },
        }),
        db.characterReport.update({
          where: { id: reportId },
          data: { status: 'resolved' },
        }),
        db.characterReport.create({
          data: {
            characterId,
            reportedBy: userId,
            category: 'other',
            notes: `REJECTED: ${rejectReason}`,
            status: 'resolved',
          },
        }),
        db.characterReport.updateMany({
          where: { characterId, status: 'pending', id: { not: reportId } },
          data: { status: 'resolved' },
        }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process review action' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (userRole !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: Admins only' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const result = featureSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const { characterId, isFeatured } = result.data

    await db.character.update({
      where: { id: characterId },
      data: { isFeatured },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to toggle featured status' },
      { status: 500 },
    )
  }
}
