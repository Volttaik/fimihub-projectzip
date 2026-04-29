import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:5000'
    const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`
    const redirectTo = `${origin}/auth/callback?next=/dashboard`

    const admin = createAdminClient()

    // Create user without email confirmation, suppressing Supabase's default email
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

    // Update profile with extra fields the trigger may not capture
    await admin.from('profiles').update({
      phone: phone ?? null,
      date_of_birth: date_of_birth ?? null,
      sex: sex ?? null,
      bio: bio ?? null,
      specialisations: specialisations ?? [],
    }).eq('id', created.user.id)

    // Generate the verification link with the proper redirect URL
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({
        success: true,
        userId: created.user.id,
        warning: 'Account created but verification link could not be generated.',
      })
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      try {
        await sendVerificationEmail(email, full_name, linkData.properties.action_link)
      } catch (e) {
        console.error('Failed to send verification email:', e)
        return NextResponse.json({
          success: true,
          userId: created.user.id,
          warning: 'Account created but verification email failed to send.',
        })
      }
    } else {
      return NextResponse.json({
        success: true,
        userId: created.user.id,
        warning: 'Email is not configured. Verification email was not sent.',
      })
    }

    return NextResponse.json({ success: true, userId: created.user.id })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
