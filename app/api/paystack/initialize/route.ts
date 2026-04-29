import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, credits, userId, email } = await request.json()

    const origin = request.headers.get('origin') ||
      request.headers.get('x-forwarded-proto') + '://' + request.headers.get('host') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:5000'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reference = `fimi_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const amountKobo = amount * 100

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        callback_url: `${origin}/credits?payment=success`,
        metadata: {
          user_id: userId,
          credits,
          custom_fields: [
            { display_name: 'Credits', variable_name: 'credits', value: credits.toString() },
          ],
        },
      }),
    })

    const data = await response.json()
    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Payment initialization failed' }, { status: 400 })
    }

    return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference })
  } catch (err) {
    console.error('Paystack initialize error:', err)
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 500 })
  }
}
