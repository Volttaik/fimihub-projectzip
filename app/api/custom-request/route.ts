import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { sendCustomRequestEmail } from '@/lib/email'
import pool from '@/lib/db'

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any)
  if (!user) return NextResponse.json({ error: 'You must be logged in to send a request' }, { status: 401 })

  const { ad_id, buyer_name, buyer_email, buyer_phone, message, budget, quantity } = await req.json()
  if (!ad_id || !buyer_name || !buyer_email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const { rows: adRows } = await pool.query(`SELECT id, user_id, title FROM ads WHERE id = $1 LIMIT 1`, [ad_id])
    if (!adRows.length) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    const ad = adRows[0]
    if (ad.user_id === user.id) return NextResponse.json({ error: "You can't request your own ad" }, { status: 400 })

    const { rows: crRows } = await pool.query(
      `INSERT INTO custom_requests (ad_id, seller_id, buyer_id, buyer_name, buyer_email, buyer_phone, message, budget, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [ad.id, ad.user_id, user.id, buyer_name, buyer_email, buyer_phone || null, message, budget ? Number(budget) : null, quantity ? Number(quantity) : null]
    )
    const crId = crRows[0].id

    const { rows: convoRows } = await pool.query(
      `INSERT INTO conversations (ad_id, buyer_id, seller_id, kind, reference_id, subject)
       VALUES ($1,$2,$3,'request',$4,$5) RETURNING id`,
      [ad.id, user.id, ad.user_id, crId, `Request: ${ad.title}`]
    )
    const conversationId = convoRows[0].id

    const opening = `Custom request${quantity ? ` (qty: ${quantity})` : ''}${budget ? ` — budget ₦${Number(budget).toLocaleString()}` : ''}\n\n${message}`
    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)`,
      [conversationId, user.id, opening]
    )
    await pool.query(`UPDATE conversations SET last_message_at = NOW() WHERE id = $1`, [conversationId])

    const { rows: sellerRows } = await pool.query(`SELECT email, full_name FROM profiles WHERE id = $1 LIMIT 1`, [ad.user_id])
    const seller = sellerRows[0]
    if (seller?.email) {
      try {
        await sendCustomRequestEmail({
          to: seller.email,
          sellerName: seller.full_name || 'there',
          adTitle: ad.title,
          buyerName: buyer_name,
          buyerEmail: buyer_email,
          buyerPhone: buyer_phone,
          message,
          budget,
          quantity,
        })
      } catch (e) {
        console.error('Failed to email seller:', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to submit request' }, { status: 500 })
  }
}
