import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCustomRequestEmail } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be logged in to send a request' }, { status: 401 })

  const { ad_id, buyer_name, buyer_email, buyer_phone, message, budget, quantity } = await req.json()
  if (!ad_id || !buyer_name || !buyer_email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: ad } = await admin
    .from('ads')
    .select('id, user_id, title')
    .eq('id', ad_id)
    .single()
  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  if (ad.user_id === user.id) return NextResponse.json({ error: "You can't request your own ad" }, { status: 400 })

  const { data: cr, error } = await admin.from('custom_requests').insert({
    ad_id: ad.id,
    seller_id: ad.user_id,
    buyer_id: user.id,
    buyer_name,
    buyer_email,
    buyer_phone: buyer_phone || null,
    message,
    budget: budget ? Number(budget) : null,
    quantity: quantity ? Number(quantity) : null,
  } as any).select('id').single()
  if (error || !cr) return NextResponse.json({ error: error?.message || 'Could not create request' }, { status: 500 })

  // Open a conversation thread for this request
  const { data: convo } = await admin
    .from('conversations')
    .insert({
      ad_id: ad.id,
      buyer_id: user.id,
      seller_id: ad.user_id,
      kind: 'request',
      reference_id: cr.id,
      subject: `Request: ${ad.title}`,
    } as any)
    .select('id')
    .single()

  if (convo) {
    const opening =
      `Custom request${quantity ? ` (qty: ${quantity})` : ''}${budget ? ` — budget ₦${Number(budget).toLocaleString()}` : ''}\n\n${message}`
    await admin.from('messages').insert({
      conversation_id: convo.id,
      sender_id: user.id,
      body: opening,
    } as any)
  }

  const { data: seller } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', ad.user_id)
    .single()

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
}
