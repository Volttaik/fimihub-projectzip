import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import RevenueClient from '@/components/RevenueClient'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
  const user = await getUser()
  if (!user) redirect('/login?redirect=/revenue')

  const [profileRes, ordersRes] = await Promise.all([
    pool.query(`SELECT * FROM profiles WHERE id = $1 LIMIT 1`, [user.id]),
    pool.query(`SELECT * FROM orders WHERE seller_id = $1 ORDER BY created_at DESC`, [user.id]),
  ])

  return <RevenueClient profile={profileRes.rows[0] ?? null} orders={ordersRes.rows} />
}
