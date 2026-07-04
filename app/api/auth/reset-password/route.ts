import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hashPassword } from '@/lib/password'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset link is invalid' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { rows } = await pool.query(
      `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1 LIMIT 1`,
      [token]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Reset link is invalid or has already been used' }, { status: 400 })
    }

    const row = rows[0]
    if (row.used) {
      return NextResponse.json({ error: 'Reset link has already been used' }, { status: 400 })
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const password_hash = await hashPassword(password)

    await pool.query(`UPDATE profiles SET password_hash = $1, email_verified = TRUE WHERE id = $2`, [
      password_hash, row.user_id,
    ])
    await pool.query(`UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`, [row.id])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 })
  }
}
