import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import DashboardClient from '@/components/DashboardClient'
import type { AppUser } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirect=/dashboard')

  const [profileRes, adsRes, txRes, boostCountRes] = await Promise.all([
    pool.query(`SELECT * FROM profiles WHERE id = $1 LIMIT 1`, [user.id]),
    pool.query(`SELECT * FROM ads WHERE user_id = $1 ORDER BY created_at DESC`, [user.id]),
    pool.query(`SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [user.id]),
    pool.query(`SELECT COUNT(*) AS cnt FROM credit_transactions WHERE user_id = $1 AND description ILIKE '%boost%'`, [user.id]),
  ])

  const freeBoostAvailable = parseInt(boostCountRes.rows[0]?.cnt ?? '0', 10) === 0

  return (
    <DashboardClient
      user={user as AppUser}
      profile={profileRes.rows[0] ?? null}
      ads={adsRes.rows}
      transactions={txRes.rows}
      freeBoostAvailable={freeBoostAvailable}
    />
  )
}
