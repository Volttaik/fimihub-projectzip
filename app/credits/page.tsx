import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import CreditsClient from '@/components/CreditsClient'

export default async function CreditsPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirect=/credits')

  const [profileRes, txRes] = await Promise.all([
    pool.query(`SELECT credits FROM profiles WHERE id = $1 LIMIT 1`, [user.id]),
    pool.query(`SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [user.id]),
  ])

  return (
    <CreditsClient
      userId={user.id}
      userEmail={user.email}
      credits={profileRes.rows[0]?.credits ?? 0}
      transactions={txRes.rows}
    />
  )
}
