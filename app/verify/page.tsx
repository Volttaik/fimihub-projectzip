import Link from 'next/link'
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pool from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' | 'used' | 'error' }

async function verifyToken(token: string | undefined): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: 'missing' }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, expires_at, used FROM email_verification_tokens WHERE token = $1 LIMIT 1`,
      [token]
    )
    if (!rows.length) return { ok: false, reason: 'invalid' }
    const row = rows[0]
    if (row.used) return { ok: false, reason: 'used' }
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' }

    await pool.query(`UPDATE profiles SET email_verified = TRUE WHERE id = $1`, [row.user_id])
    await pool.query(`UPDATE email_verification_tokens SET used = TRUE WHERE id = $1`, [row.id])

    const { rows: pRows } = await pool.query(`SELECT email, full_name FROM profiles WHERE id = $1`, [row.user_id])
    const profile = pRows[0]

    try {
      const h = await headers()
      const host = h.get('x-forwarded-host') || h.get('host') || ''
      const proto = h.get('x-forwarded-proto') || 'https'
      const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : undefined)
      if (profile?.email) await sendWelcomeEmail(profile.email, profile.full_name || 'there', origin)
    } catch (e) {
      console.error('Welcome email failed:', e)
    }

    return { ok: true, email: profile?.email || '' }
  } catch (e) {
    console.error('Verify token error:', e)
    return { ok: false, reason: 'error' }
  }
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  const result = await verifyToken(params.token)

  if (result.ok) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-3xl p-10 shadow-md">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email verified</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Welcome to FimiHub{result.email ? `, ${result.email}` : ''}. Your account is now active.
            </p>
            <Link href="/login">
              <Button className="w-full gap-2">Sign in <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const messages: Record<typeof result.reason, { title: string; body: string }> = {
    missing: { title: 'No verification token', body: 'This page needs a valid verification link from your email.' },
    invalid: { title: 'Invalid link', body: 'We could not find this verification link. It may have already been used or copied incorrectly.' },
    expired: { title: 'Link expired', body: 'This verification link has expired. Please request a new one.' },
    used: { title: 'Already verified', body: 'This link has already been used. Your account is active — please sign in.' },
    error: { title: 'Verification failed', body: 'Something went wrong while verifying your account. Please try again or contact support.' },
  }
  const m = messages[result.reason]

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="glass rounded-3xl p-10 shadow-md">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{m.title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">{m.body}</p>
          <div className="flex flex-col gap-2">
            <Link href="/login"><Button className="w-full">Go to Sign In</Button></Link>
            <Link href="/register"><Button variant="outline" className="w-full">Create a new account</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
