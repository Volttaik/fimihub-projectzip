import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import AdDetailClient from '@/components/AdDetailClient'
import type { Ad } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { rows: adRows } = await pool.query(`
    SELECT a.*,
      json_build_object(
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'email', p.email,
        'phone', p.phone,
        'location', p.location,
        'created_at', p.created_at
      ) AS profiles
    FROM ads a
    LEFT JOIN profiles p ON p.id = a.user_id
    WHERE a.id = $1
    LIMIT 1
  `, [id])

  if (!adRows.length) notFound()
  const ad = adRows[0] as Ad

  const user = await getUser()

  // Track unique view per logged-in non-owner
  if (user && user.id !== ad.user_id) {
    try {
      const { rowCount } = await pool.query(
        `INSERT INTO ad_views (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [user.id, id]
      )
      if (rowCount && rowCount > 0) {
        await pool.query(`UPDATE ads SET views = views + 1 WHERE id = $1`, [id])
      }
    } catch {}
  }

  const { rows: similar } = await pool.query(`
    SELECT a.*,
      json_build_object('full_name', p.full_name) AS profiles
    FROM ads a
    LEFT JOIN profiles p ON p.id = a.user_id
    WHERE a.category = $1 AND a.status = 'active' AND a.id != $2
    LIMIT 4
  `, [ad.category, id])

  return (
    <AdDetailClient
      ad={ad}
      similar={similar as Ad[]}
      currentUserId={user?.id ?? null}
    />
  )
}
