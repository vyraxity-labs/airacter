import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { BillingClient } from '@/components/settings/billing-client'

export const dynamic = 'force-dynamic'

export default async function BillingSettingsPage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/auth/login')
  }

  return <BillingClient />
}
