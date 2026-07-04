import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any)
  if (!user) return NextResponse.json({ error: 'You must be logged in to message a seller' }, { status: 401 })

  const { ad_id, body } = await req.json()
  if (!ad_id || !body?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  try {
    const { rows: adRows } = await pool.query(
      `SELECT id, title, user_id FROM ads WHERE id = $1 LIMIT 1`,
      [ad_id]
    )
    if (!adRows.length) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    const ad = adRows[0]
    if (ad.user_id === user.id) return NextResponse.json({ error: "You can't message yourself" }, { status: 400 })

    // Reuse existing inquiry thread
    const { rows: existing } = await pool.query(
      `SELECT id FROM conversations WHERE ad_id = $1 AND buyer_id = $2 AND kind = 'inquiry' LIMIT 1`,
      [ad_id, user.id]
    )
    let conversationId: string
    if (existing.length) {
      conversationId = existing[0].id
    } else {
      const { rows } = await pool.query(
        `INSERT INTO conversations (ad_id, buyer_id, seller_id, kind, subject) VALUES ($1,$2,$3,'inquiry',$4) RETURNING id`,
        [ad.id, user.id, ad.user_id, ad.title]
      )
      conversationId = rows[0].id
    }

    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)`,
      [conversationId, user.id, body.trim()]
    )
    await pool.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversationId]
    )

    return NextResponse.json({ ok: true, conversation_id: conversationId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
