import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nairaToKobo } from '@/lib/paystack'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be logged in to place an order' }, { status: 401 })

  const { ad_id, quantity, note, buyer_phone } = await req.json()
  if (!ad_id) return NextResponse.json({ error: 'Missing ad_id' }, { status: 400 })

  const qty = Math.max(1, Number(quantity || 1))
  const admin = createAdminClient()

  const { data: ad, error: adErr } = await admin
    .from('ads')
    .select('id, title, price, quantity, user_id, status')
    .eq('id', ad_id)
    .single()
  if (adErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  if (ad.status !== 'active') return NextResponse.json({ error: 'Ad is not available' }, { status: 400 })
  if (ad.user_id === user.id) return NextResponse.json({ error: "You can't order your own ad" }, { status: 400 })
  if (typeof ad.quantity === 'number' && ad.quantity < qty) {
    return NextResponse.json({ error: `Only ${ad.quantity} available` }, { status: 400 })
  }

  const { data: buyerProfile } = await admin
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .single()

  const totalNaira = ad.price ? Number(ad.price) * qty : 0
  const amount_kobo = totalNaira > 0 ? nairaToKobo(totalNaira) : 0

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      ad_id: ad.id,
      buyer_id: user.id,
      seller_id: ad.user_id,
      buyer_email: buyerProfile?.email || user.email || '',
      buyer_name: buyerProfile?.full_name || 'Buyer',
      buyer_phone: buyer_phone || buyerProfile?.phone || null,
      quantity: qty,
      amount_kobo,
      seller_amount_kobo: 0,
      platform_fee_kobo: 0,
      paystack_reference: null,
      ad_title: ad.title,
      status: 'placed',
    } as any)
    .select('id')
    .single()
  if (orderErr || !order) return NextResponse.json({ error: orderErr?.message || 'Could not place order' }, { status: 500 })

  // Create or reuse a conversation for this order
  const { data: convo, error: convoErr } = await admin
    .from('conversations')
    .insert({
      ad_id: ad.id,
      buyer_id: user.id,
      seller_id: ad.user_id,
      kind: 'order',
      reference_id: order.id,
      subject: `Order: ${ad.title}`,
    } as any)
    .select('id')
    .single()
  if (convoErr || !convo) return NextResponse.json({ error: 'Order placed but could not start conversation' }, { status: 500 })

  const opening = note?.trim()
    ? `Hi! I'd like to order ${qty} of "${ad.title}".\n\n${note.trim()}`
    : `Hi! I'd like to order ${qty} of "${ad.title}". Please confirm availability.`

  await admin.from('messages').insert({
    conversation_id: convo.id,
    sender_id: user.id,
    body: opening,
  } as any)

  return NextResponse.json({ ok: true, order_id: order.id, conversation_id: convo.id })
}
