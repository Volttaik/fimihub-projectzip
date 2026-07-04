import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

const BOOST_COST = 5

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adId } = await params
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { isFree } = await req.json().catch(() => ({ isFree: false }))
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Verify ad ownership
    const { rows: adRows } = await pool.query(
      `SELECT id FROM ads WHERE id = $1 AND user_id = $2`,
      [adId, user.id]
    )
    if (!adRows.length) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })

    if (!isFree) {
      const { rows: pRows } = await pool.query(`SELECT credits FROM profiles WHERE id = $1`, [user.id])
      const credits = pRows[0]?.credits ?? 0
      if (credits < BOOST_COST) return NextResponse.json({ error: 'Not enough credits' }, { status: 402 })
      await pool.query(`UPDATE profiles SET credits = credits - $1 WHERE id = $2`, [BOOST_COST, user.id])
    }

    await pool.query(
      `UPDATE ads SET is_boosted = TRUE, boost_expires_at = $1 WHERE id = $2`,
      [expiresAt, adId]
    )

    const desc = isFree ? 'Free boost (welcome gift)' : 'Boost ad (7 days)'
    await pool.query(
      `INSERT INTO credit_transactions (user_id, amount, type, description, reference)
       VALUES ($1,$2,'spend',$3,$4)`,
      [user.id, isFree ? 0 : BOOST_COST, desc, `boost_${adId}`]
    )

    return NextResponse.json({ ok: true, expiresAt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
