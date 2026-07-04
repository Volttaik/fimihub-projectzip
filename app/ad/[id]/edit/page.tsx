import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import EditAdClient from '@/components/EditAdClient'

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect(`/login?redirect=/ad/${id}/edit`)

  const [adRes, profileRes] = await Promise.all([
    pool.query(`SELECT * FROM ads WHERE id = $1 LIMIT 1`, [id]),
    pool.query(`SELECT paystack_subaccount_code FROM profiles WHERE id = $1 LIMIT 1`, [user.id]),
  ])

  if (!adRes.rows.length) notFound()
  const ad = adRes.rows[0]
  if (ad.user_id !== user.id) redirect(`/ad/${id}`)

  return (
    <EditAdClient
      ad={ad}
      hasPayoutAccount={!!profileRes.rows[0]?.paystack_subaccount_code}
    />
  )
}
