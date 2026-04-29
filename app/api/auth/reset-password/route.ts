import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset link is invalid' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: row, error: lookupError } = await admin
      .from('password_reset_tokens' as any)
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .maybeSingle()

    if (lookupError || !row) {
      return NextResponse.json({ error: 'Reset link is invalid or has already been used' }, { status: 400 })
    }

    const tokenRow = row as { id: string; user_id: string; expires_at: string; used: boolean }

    if (tokenRow.used) {
      return NextResponse.json({ error: 'Reset link has already been used' }, { status: 400 })
    }
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(tokenRow.user_id, { password })
    if (updateError) {
      console.error('Password update failed:', updateError)
      return NextResponse.json({ error: 'Could not update password' }, { status: 500 })
    }

    await admin
      .from('password_reset_tokens' as any)
      .update({ used: true })
      .eq('id', tokenRow.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 })
  }
}
