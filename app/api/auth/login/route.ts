import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { signSession, buildSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { rows } = await pool.query(
      `SELECT id, email, password_hash, email_verified FROM profiles WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    )

    const user = rows[0]
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before signing in.', code: 'email_not_confirmed' },
        { status: 403 }
      )
    }

    const token = await signSession({ id: user.id, email: user.email })
    const cookie = buildSessionCookie(token)

    const res = NextResponse.json({ ok: true })
    res.headers.set('Set-Cookie', cookie)
    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
