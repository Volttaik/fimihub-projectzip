import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name, userId } = await request.json()
    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const origin = request.headers.get('origin') ||
      request.headers.get('x-forwarded-proto') + '://' + request.headers.get('host') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:5000'

    const supabase = await createClient()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error || !data.properties?.action_link) {
      return NextResponse.json({ error: 'Failed to generate verification link' }, { status: 500 })
    }

    await sendVerificationEmail(email, name, data.properties.action_link)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send verification error:', err)
    return NextResponse.json({ error: 'Email service unavailable' }, { status: 500 })
  }
}
