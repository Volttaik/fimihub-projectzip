import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

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

    const { reference, metadata, amount } = event.data
    const userId = metadata?.user_id
    const credits = Number(metadata?.credits || 0)

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check for duplicate webhook
    const { data: existing } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('reference', reference)
      .single()

    if (existing) return NextResponse.json({ received: true })

    // Add credits to user
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    const currentCredits = profile?.credits || 0
    await supabase.from('profiles').update({ credits: currentCredits + credits }).eq('id', userId)

    // Record transaction
    await supabase.from('credit_transactions').insert({
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
