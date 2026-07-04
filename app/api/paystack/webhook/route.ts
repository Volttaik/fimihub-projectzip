import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { sendOrderEmails } from '@/lib/email'
import { koboToNaira } from '@/lib/paystack'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex')
    const signature = request.headers.get('x-paystack-signature')
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    if (event.event !== 'charge.success') return NextResponse.json({ received: true })

    const { reference, metadata } = event.data

    // ── Order payment ──────────────────────────────────────────────────────────
    if (metadata?.type === 'order') {
      const { rows: orderRows } = await pool.query(
        `SELECT id, ad_id, quantity, status, buyer_id, seller_id, buyer_email, buyer_name, buyer_phone, amount_kobo, ad_title, shipping_address, shipping_state, shipping_city, delivery_notes
         FROM orders WHERE paystack_reference = $1 LIMIT 1`,
        [reference]
      )
      if (!orderRows.length) return NextResponse.json({ received: true })
      const order = orderRows[0]
      if (order.status === 'paid') return NextResponse.json({ received: true })

      await pool.query(
        `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $1`,
        [order.id]
      )

      // Decrement stock
      if (order.ad_id) {
        const { rows: adRows } = await pool.query(`SELECT quantity FROM ads WHERE id = $1 LIMIT 1`, [order.ad_id])
        if (adRows[0] && typeof adRows[0].quantity === 'number') {
          const next = Math.max(0, adRows[0].quantity - (order.quantity || 1))
          const update = next === 0 ? `quantity = 0, status = 'sold'` : `quantity = ${next}`
          await pool.query(`UPDATE ads SET ${update} WHERE id = $1`, [order.ad_id])
        }
      }

      // Open or reuse conversation
      let conversationId: string | null = null
      if (order.buyer_id && order.seller_id && order.ad_id) {
        const { rows: existingConvo } = await pool.query(
          `SELECT id FROM conversations WHERE reference_id = $1 AND kind = 'order' LIMIT 1`,
          [order.id]
        )
        if (existingConvo.length) {
          conversationId = existingConvo[0].id
        } else {
          const { rows: convoRows } = await pool.query(
            `INSERT INTO conversations (ad_id, buyer_id, seller_id, kind, reference_id, subject)
             VALUES ($1,$2,$3,'order',$4,$5) RETURNING id`,
            [order.ad_id, order.buyer_id, order.seller_id, order.id, `Order paid: ${order.ad_title}`]
          )
          conversationId = convoRows[0]?.id ?? null
        }

        if (conversationId) {
          const shippingLine = order.shipping_address
            ? `\n\nDeliver to:\n${order.shipping_address}, ${order.shipping_city || ''} ${order.shipping_state || ''}`.trim()
            + (order.delivery_notes ? `\n\nNotes: ${order.delivery_notes}` : '')
            : ''
          await pool.query(
            `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)`,
            [conversationId, order.buyer_id, `Payment received for ${order.quantity} × "${order.ad_title}". Reference: ${reference}.${shippingLine}`]
          )
          await pool.query(`UPDATE conversations SET last_message_at = NOW() WHERE id = $1`, [conversationId])
        }
      }

      // Email notifications
      try {
        const { rows: sellerRows } = await pool.query(
          `SELECT full_name, email FROM profiles WHERE id = $1 LIMIT 1`,
          [order.seller_id]
        )
        const seller = sellerRows[0]
        if (seller) {
          await sendOrderEmails({
            buyerEmail: order.buyer_email,
            buyerName: order.buyer_name || 'Buyer',
            buyerPhone: order.buyer_phone,
            sellerEmail: seller.email,
            sellerName: seller.full_name || 'Seller',
            adTitle: order.ad_title || 'Item',
            amountNaira: koboToNaira(order.amount_kobo),
            quantity: order.quantity,
            reference,
          })
        }
      } catch (e) {
        console.error('Order emails failed:', e)
      }

      return NextResponse.json({ received: true })
    }

    // ── Credit purchase ────────────────────────────────────────────────────────
    if (metadata?.user_id && metadata?.credits) {
      const userId = metadata.user_id
      const credits = Number(metadata.credits)

      // Idempotency: skip if reference already processed
      const { rows: existing } = await pool.query(
        `SELECT id FROM credit_transactions WHERE reference = $1 LIMIT 1`,
        [reference]
      )
      if (existing.length) return NextResponse.json({ received: true })

      await pool.query(`UPDATE profiles SET credits = credits + $1 WHERE id = $2`, [credits, userId])
      await pool.query(
        `INSERT INTO credit_transactions (user_id, amount, type, description, reference) VALUES ($1,$2,'purchase',$3,$4)`,
        [userId, credits, `Purchased ${credits} credits`, reference]
      )
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
