import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import BankAccountClient from '@/components/BankAccountClient'

export const dynamic = 'force-dynamic'

export default async function BankAccountPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirect=/bank-account')

  const { rows } = await pool.query(`SELECT * FROM profiles WHERE id = $1 LIMIT 1`, [user.id])
  return <BankAccountClient profile={rows[0] ?? null} />
}
