import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { initializeTransaction, nairaToKobo, PLATFORM_FEE_PERCENT } from '@/lib/paystack'
import crypto from 'crypto'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { ad_id, quantity, buyer_email, buyer_name, buyer_phone } = await req.json()
  if (!ad_id || !buyer_email || !buyer_name) {
    return NextResponse.json({ error: 'Missing buyer details' }, { status: 400 })
  }
  const qty = Math.max(1, Number(quantity || 1))

  const { data: ad, error: adErr } = await admin
    .from('ads')
    .select('id, title, price, accept_payments, quantity, user_id, status')
    .eq('id', ad_id)
    .single()
  if (adErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  if (ad.status !== 'active') return NextResponse.json({ error: 'Ad is not active' }, { status: 400 })
  if (!ad.accept_payments) return NextResponse.json({ error: 'This seller does not accept payments' }, { status: 400 })
  if (!ad.price || ad.price <= 0) return NextResponse.json({ error: 'Ad has no price set' }, { status: 400 })
  if (typeof ad.quantity === 'number' && ad.quantity < qty) {
    return NextResponse.json({ error: `Only ${ad.quantity} available` }, { status: 400 })
  }

  const { data: seller } = await admin
    .from('profiles')
    .select('paystack_subaccount_code, full_name, email')
    .eq('id', ad.user_id)
    .single()
  if (!seller?.paystack_subaccount_code) {
    return NextResponse.json({ error: 'Seller has not connected a payout account' }, { status: 400 })
  }

  const totalNaira = Number(ad.price) * qty
  const amount_kobo = nairaToKobo(totalNaira)
  const platform_fee_kobo = Math.round((amount_kobo * PLATFORM_FEE_PERCENT) / 100)
  const seller_amount_kobo = amount_kobo - platform_fee_kobo
  const reference = `ord_${crypto.randomBytes(8).toString('hex')}`

  await admin.from('orders').insert({
    ad_id: ad.id,
    buyer_id: user?.id ?? null,
    seller_id: ad.user_id,
    buyer_email,
    buyer_name,
    buyer_phone: buyer_phone || null,
    quantity: qty,
    amount_kobo,
    seller_amount_kobo,
    platform_fee_kobo,
    paystack_reference: reference,
    ad_title: ad.title,
    status: 'pending',
  })

  const origin = new URL(req.url).origin
  try {
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
