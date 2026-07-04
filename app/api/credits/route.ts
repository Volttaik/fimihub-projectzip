import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

/** POST /api/credits — add or deduct credits for the authenticated user */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { amount, type, description, reference } = await req.json()
    if (!amount || !type || !description) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const delta = type === 'spend' ? -Math.abs(amount) : Math.abs(amount)
    const { rows: pRows } = await pool.query(`SELECT credits FROM profiles WHERE id = $1`, [user.id])
    const current = pRows[0]?.credits ?? 0
    if (type === 'spend' && current < Math.abs(amount)) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    await pool.query(`UPDATE profiles SET credits = credits + $1 WHERE id = $2`, [delta, user.id])
    const { rows } = await pool.query(
      `INSERT INTO credit_transactions (user_id, amount, type, description, reference) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user.id, Math.abs(amount), type, description, reference ?? null]
    )
    return NextResponse.json({ transaction: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
