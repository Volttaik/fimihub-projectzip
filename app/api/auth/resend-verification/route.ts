import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

const TOKEN_LIFETIME_HOURS = 24

function getOrigin(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:5000'
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const origin = getOrigin(request)
    const admin = createAdminClient()
    const normalisedEmail = email.trim().toLowerCase()

    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, email, email_verified')
      .ilike('email', normalisedEmail)
      .maybeSingle()

    // Always return success to avoid email enumeration
    if (!profile) return NextResponse.json({ success: true })
    if (profile.email_verified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_HOURS * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await admin
      .from('email_verification_tokens' as any)
      .insert({ user_id: profile.id, token, expires_at: expiresAt })

    if (tokenError) {
      console.error('Resend verification token insert failed:', tokenError)
      return NextResponse.json({ error: 'Could not create verification link' }, { status: 500 })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json({ success: true, warning: 'Email not configured' })
    }

    const verificationUrl = `${origin}/verify?token=${token}`
    try {
      await sendVerificationEmail(profile.email, profile.full_name || '', verificationUrl)
    } catch (e) {
      console.error('Resend verification email failed:', e)
      return NextResponse.json({ error: 'Could not send verification email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Resend verification error:', err)
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 })
  }
}
