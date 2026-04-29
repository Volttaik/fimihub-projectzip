import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

const TOKEN_LIFETIME_MINUTES = 60

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
      .select('id, full_name, email')
      .ilike('email', normalisedEmail)
      .maybeSingle()

    if (profile) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MINUTES * 60 * 1000).toISOString()

      const { error: tokenError } = await admin
        .from('password_reset_tokens' as any)
        .insert({ user_id: profile.id, token, expires_at: expiresAt })

      if (tokenError) {
        console.error('Reset token insert failed:', tokenError)
        return NextResponse.json({ error: 'Could not create reset link' }, { status: 500 })
      }

      const resetUrl = `${origin}/reset-password?token=${token}`

      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.error('Email service not configured for password reset')
      } else {
        try {
          await sendPasswordResetEmail(profile.email, profile.full_name || '', resetUrl)
        } catch (e) {
          console.error('Password reset email failed:', e)
        }
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 })
  }
}
