import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any)
  if (!user) return NextResponse.json({ error: 'You must be logged in to place an order' }, { status: 401 })

  const { ad_id, quantity, note, buyer_phone } = await req.json()
  if (!ad_id) return NextResponse.json({ error: 'Missing ad_id' }, { status: 400 })
  const qty = Math.max(1, Number(quantity || 1))

  try {
    const { rows: adRows } = await pool.query(
      `SELECT id, title, price, quantity, user_id, status FROM ads WHERE id = $1 LIMIT 1`,
      [ad_id]
    )
    if (!adRows.length) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    const ad = adRows[0]
    if (ad.status !== 'active') return NextResponse.json({ error: 'Ad is not available' }, { status: 400 })
    if (ad.user_id === user.id) return NextResponse.json({ error: "You can't order your own ad" }, { status: 400 })
    if (typeof ad.quantity === 'number' && ad.quantity < qty) {
      return NextResponse.json({ error: `Only ${ad.quantity} available` }, { status: 400 })
    }

    const { rows: buyerRows } = await pool.query(
      `SELECT full_name, email, phone FROM profiles WHERE id = $1 LIMIT 1`,
      [user.id]
    )
    const buyer = buyerRows[0]

    const { rows: orderRows } = await pool.query(
      `INSERT INTO orders (ad_id, buyer_id, seller_id, buyer_email, buyer_name, buyer_phone, quantity, ad_title, status, amount_kobo, seller_amount_kobo, platform_fee_kobo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'placed',0,0,0)
       RETURNING id`,
      [ad.id, user.id, ad.user_id, buyer?.email || user.email, buyer?.full_name || null, buyer_phone || buyer?.phone || null, qty, ad.title]
    )
    const orderId = orderRows[0].id

    const { rows: convoRows } = await pool.query(
      `INSERT INTO conversations (ad_id, buyer_id, seller_id, kind, reference_id, subject)
       VALUES ($1,$2,$3,'order',$4,$5)
       RETURNING id`,
      [ad.id, user.id, ad.user_id, orderId, `Order: ${ad.title}`]
    )
    const conversationId = convoRows[0].id

    const opening = `Order placed${qty > 1 ? ` (qty: ${qty})` : ''}${note ? `\n\n${note}` : ''}`
    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)`,
      [conversationId, user.id, opening]
    )
    await pool.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversationId]
    )

    return NextResponse.json({ ok: true, order_id: orderId, conversation_id: conversationId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not place order' }, { status: 500 })
  }
}
