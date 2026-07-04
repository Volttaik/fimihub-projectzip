import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { hashPassword } from '@/lib/password'
import pool from '@/lib/db'

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

    // Check existing user
    const { rows: existing } = await pool.query(
      `SELECT id FROM profiles WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    )
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    const origin = getOrigin(request)

    // Create user profile
    const { rows } = await pool.query(
      `INSERT INTO profiles (email, password_hash, full_name, phone, date_of_birth, sex, bio, specialisations, credits, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,false)
       RETURNING id, email`,
      [
        email.trim().toLowerCase(),
        password_hash,
        full_name,
        phone ?? null,
        date_of_birth ?? null,
        sex ?? null,
        bio ?? null,
        Array.isArray(specialisations) ? specialisations : [],
      ]
    )
    const newUser = rows[0]

    // Create verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_HOURS * 3600 * 1000).toISOString()

    const { rowCount: tokenInserted } = await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [newUser.id, token, expiresAt]
    )

    if (!tokenInserted) {
      return NextResponse.json({
        success: true,
        userId: newUser.id,
        warning: 'Account created but verification token could not be issued.',
      })
    }

    const verificationUrl = `${origin}/verify?token=${token}`

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: true,
        userId: newUser.id,
        warning: 'Email service not configured. Verification link could not be sent.',
      })
    }

    try {
      await sendVerificationEmail(newUser.email, full_name, verificationUrl)
    } catch (e) {
      console.error('Verification email failed:', e)
      return NextResponse.json({
        success: true,
        userId: newUser.id,
        warning: 'Account created but verification email failed to send.',
      })
    }

    return NextResponse.json({ success: true, userId: newUser.id })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
