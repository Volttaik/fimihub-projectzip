import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import RequestsClient from '@/components/RequestsClient'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirect=/requests')

  const { rows: requests } = await pool.query(`
    SELECT cr.*,
      json_build_object('id', a.id, 'title', a.title) AS ad
    FROM custom_requests cr
    LEFT JOIN ads a ON a.id = cr.ad_id
    WHERE cr.seller_id = $1
    ORDER BY cr.created_at DESC
  `, [user.id])

  return <RequestsClient requests={requests} />
}
