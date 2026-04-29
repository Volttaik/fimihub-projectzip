import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCustomRequestEmail } from '@/lib/email'

export async function POST(req: Request) {
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

  const { error } = await admin.from('custom_requests').insert({
    ad_id: ad.id,
    seller_id: ad.user_id,
    buyer_name,
    buyer_email,
    buyer_phone: buyer_phone || null,
    message,
    budget: budget ? Number(budget) : null,
    quantity: quantity ? Number(quantity) : null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
