import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

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
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true })
    }

    const { reference, metadata } = event.data
    const admin = createAdminClient()

    // Order payment branch
    if (metadata?.type === 'order') {
      const { data: order } = await admin
        .from('orders')
        .select('id, ad_id, quantity, status')
        .eq('paystack_reference', reference)
        .single()

      if (!order) return NextResponse.json({ received: true })
      if (order.status === 'paid') return NextResponse.json({ received: true })

      await admin
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id)

      // Decrement stock if tracked
      if (order.ad_id) {
        const { data: ad } = await admin
          .from('ads')
          .select('quantity')
          .eq('id', order.ad_id)
          .single()
        if (ad && typeof ad.quantity === 'number') {
          const next = Math.max(0, ad.quantity - (order.quantity || 1))
          const update: any = { quantity: next }
          if (next === 0) update.status = 'sold'
          await admin.from('ads').update(update).eq('id', order.ad_id)
        }
      }

      return NextResponse.json({ received: true })
    }

    // Credits purchase branch
    const userId = metadata?.user_id
    const credits = Number(metadata?.credits || 0)
    if (!userId || !credits) {
      return NextResponse.json({ received: true })
    }

    const { data: existing } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('reference', reference)
      .single()
    if (existing) return NextResponse.json({ received: true })

    const { data: profile } = await admin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()
    const currentCredits = profile?.credits || 0
    await admin.from('profiles').update({ credits: currentCredits + credits }).eq('id', userId)

    await admin.from('credit_transactions').insert({
      user_id: userId,
      amount: credits,
      type: 'purchase',
      description: `Purchased ${credits} credits via Paystack`,
      reference,
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Paystack webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
