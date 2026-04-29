import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderEmails } from '@/lib/email'
import { koboToNaira } from '@/lib/paystack'

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
        .select('id, ad_id, quantity, status, buyer_id, seller_id, buyer_email, buyer_name, buyer_phone, amount_kobo, ad_title, shipping_address, shipping_state, shipping_city, delivery_notes')
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

      // Open (or reuse) an inbox conversation for this paid order, with both sides notified.
      let conversationId: string | null = null
      if (order.buyer_id && order.seller_id && order.ad_id) {
        const { data: existingConvo } = await admin
          .from('conversations')
          .select('id')
          .eq('reference_id', order.id)
          .eq('kind', 'order')
          .maybeSingle()

        if (existingConvo) {
          conversationId = existingConvo.id
        } else {
          const { data: convo } = await admin
            .from('conversations')
            .insert({
              ad_id: order.ad_id,
              buyer_id: order.buyer_id,
              seller_id: order.seller_id,
              kind: 'order',
              reference_id: order.id,
              subject: `Order paid: ${order.ad_title}`,
            } as any)
            .select('id')
            .single()
          conversationId = convo?.id ?? null
        }

        if (conversationId) {
          const shippingLine =
            (order as any).shipping_address
              ? `\n\nDeliver to:\n${(order as any).shipping_address}, ${(order as any).shipping_city || ''} ${(order as any).shipping_state || ''}`.trim() +
                ((order as any).delivery_notes ? `\n\nNotes: ${(order as any).delivery_notes}` : '')
              : ''
          const opening = `Payment received for ${order.quantity} × "${order.ad_title}". Reference: ${reference}.${shippingLine}`
          await admin.from('messages').insert({
            conversation_id: conversationId,
            sender_id: order.buyer_id,
            body: opening,
          } as any)
        }
      }

      // Send confirmation + sale emails (Gmail via nodemailer)
      try {
        const { data: seller } = await admin
          .from('profiles')
          .select('email, full_name')
          .eq('id', order.seller_id)
          .single()
        if (seller?.email) {
          await sendOrderEmails({
            buyerEmail: order.buyer_email,
            buyerName: order.buyer_name || 'Buyer',
            sellerEmail: seller.email,
            sellerName: seller.full_name || 'Seller',
            adTitle: order.ad_title || 'your item',
            amountNaira: koboToNaira(order.amount_kobo),
            quantity: order.quantity,
            reference,
            buyerPhone: order.buyer_phone,
          })
        }
      } catch (mailErr) {
        console.error('Order email failed:', mailErr)
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
