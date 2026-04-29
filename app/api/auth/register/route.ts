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
    const body = await request.json()
    const { email, password, full_name, phone, date_of_birth, sex, bio, specialisations } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const origin = getOrigin(request)
    const admin = createAdminClient()

    // 1. Create the user without sending Supabase's default email
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name,
        phone,
        date_of_birth,
        sex,
        bio,
        specialisations,
      },
    })

    if (createError || !created?.user) {
      const msg = createError?.message || 'Could not create account'
      const status = msg.toLowerCase().includes('already') ? 409 : 400
      return NextResponse.json({ error: msg }, { status })
    }

    // 2. Update profile with extra fields
    await admin.from('profiles').update({
      phone: phone ?? null,
      date_of_birth: date_of_birth ?? null,
      sex: sex ?? null,
      bio: bio ?? null,
      specialisations: specialisations ?? [],
    }).eq('id', created.user.id)

    // 3. Generate our own opaque verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_HOURS * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await admin.from('email_verification_tokens' as any).insert({
      user_id: created.user.id,
      token,
      expires_at: expiresAt,
    })

    if (tokenError) {
      console.error('Token insert failed:', tokenError)
      return NextResponse.json({
        success: true,
        userId: created.user.id,
        warning: 'Account created but verification token could not be issued. Contact support.',
      })
    }

    // 4. Send our branded verification email — link points to OUR domain only
    const verificationUrl = `${origin}/verify?token=${token}`

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: true,
        userId: created.user.id,
        warning: 'Email service not configured. Verification link could not be sent.',
      })
    }

    try {
      await sendVerificationEmail(email, full_name, verificationUrl)
    } catch (e) {
      console.error('Verification email failed:', e)
      return NextResponse.json({
        success: true,
        userId: created.user.id,
        warning: 'Account created but verification email failed to send.',
      })
    }

    return NextResponse.json({ success: true, userId: created.user.id })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
