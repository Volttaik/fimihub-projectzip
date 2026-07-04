import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { initializeTransaction, nairaToKobo, PLATFORM_FEE_PERCENT } from '@/lib/paystack'
import pool from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any)

  const {
    ad_id, quantity, buyer_email, buyer_name, buyer_phone,
    shipping_address, shipping_state, shipping_city, delivery_notes,
  } = await req.json()

  if (!ad_id || !buyer_email || !buyer_name) {
    return NextResponse.json({ error: 'Missing buyer details' }, { status: 400 })
  }
  const qty = Math.max(1, Number(quantity || 1))

  try {
    const { rows: adRows } = await pool.query(
      `SELECT id, title, price, accept_payments, requires_shipping, quantity, user_id, status FROM ads WHERE id = $1 LIMIT 1`,
      [ad_id]
    )
    if (!adRows.length) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    const ad = adRows[0]
    if (ad.status !== 'active') return NextResponse.json({ error: 'Ad is not active' }, { status: 400 })
    if (!ad.accept_payments) return NextResponse.json({ error: 'This seller does not accept payments' }, { status: 400 })
    if (ad.requires_shipping && (!shipping_address || !shipping_state || !shipping_city)) {
      return NextResponse.json({ error: 'Please provide your full delivery address' }, { status: 400 })
    }
    if (!ad.price || ad.price <= 0) return NextResponse.json({ error: 'Ad has no price set' }, { status: 400 })
    if (typeof ad.quantity === 'number' && ad.quantity < qty) {
      return NextResponse.json({ error: `Only ${ad.quantity} available` }, { status: 400 })
    }

    const { rows: sellerRows } = await pool.query(
      `SELECT paystack_subaccount_code, full_name, email FROM profiles WHERE id = $1 LIMIT 1`,
      [ad.user_id]
    )
    const seller = sellerRows[0]
    if (!seller?.paystack_subaccount_code) {
      return NextResponse.json({ error: 'Seller has not connected a payout account' }, { status: 400 })
    }

    const totalNaira = Number(ad.price) * qty
    const amount_kobo = nairaToKobo(totalNaira)
    const platform_fee_kobo = Math.round((amount_kobo * PLATFORM_FEE_PERCENT) / 100)
    const seller_amount_kobo = amount_kobo - platform_fee_kobo
    const reference = `ord_${crypto.randomBytes(8).toString('hex')}`

    await pool.query(
      `INSERT INTO orders (ad_id, buyer_id, seller_id, buyer_email, buyer_name, buyer_phone, quantity, amount_kobo, seller_amount_kobo, platform_fee_kobo, paystack_reference, ad_title, status, shipping_address, shipping_state, shipping_city, delivery_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13,$14,$15,$16)`,
      [
        ad.id, user?.id ?? null, ad.user_id,
        buyer_email, buyer_name, buyer_phone || null,
        qty, amount_kobo, seller_amount_kobo, platform_fee_kobo,
        reference, ad.title,
        shipping_address || null, shipping_state || null, shipping_city || null, delivery_notes || null,
      ]
    )

    const origin = new URL(req.url).origin
    const tx = await initializeTransaction({
      email: buyer_email,
      amount_kobo,
      reference,
      callback_url: `${origin}/orders/${reference}`,
      subaccount: seller.paystack_subaccount_code,
      bearer: 'subaccount',
      metadata: {
        type: 'order',
        ad_id: ad.id,
        seller_id: ad.user_id,
        buyer_id: user?.id ?? null,
        quantity: qty,
      },
    })
    return NextResponse.json({ authorization_url: tx.authorization_url, reference })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not start checkout' }, { status: 500 })
  }
}
