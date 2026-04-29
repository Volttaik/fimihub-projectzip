import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:5000'
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`

    const redirectTo = `${origin}/auth/callback?next=/dashboard`

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      // Email not configured — Supabase will send its own verification email
      return NextResponse.json({ success: true, note: 'Using Supabase default email' })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      return NextResponse.json({ error: 'Could not generate verification link' }, { status: 500 })
    }

    await sendVerificationEmail(email, name, data.properties.action_link)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Verification email error:', err)
    return NextResponse.json({ error: 'Email service error' }, { status: 500 })
  }
}
