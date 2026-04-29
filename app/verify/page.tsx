import Link from 'next/link'
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' | 'used' | 'error' }

async function verifyToken(token: string | undefined): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: 'missing' }

  const admin = createAdminClient()

  const { data: row, error } = await admin
    .from('email_verification_tokens' as any)
    .select('user_id, expires_at, used')
    .eq('token', token)
    .maybeSingle()

  if (error || !row) return { ok: false, reason: 'invalid' }
  const r = row as { user_id: string; expires_at: string; used: boolean }
  if (r.used) return { ok: false, reason: 'used' }
  if (new Date(r.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' }

  // Confirm the user in Supabase (silently)
  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(r.user_id, {
    email_confirm: true,
  })
  if (updateError || !updated?.user) return { ok: false, reason: 'error' }

  // Mark token used and profile verified
  await admin.from('email_verification_tokens' as any).update({ used: true }).eq('token', token)
  await admin.from('profiles').update({ email_verified: true }).eq('id', r.user_id)

  // Send welcome email (non-blocking on failure)
  try {
    const profile = await admin.from('profiles').select('full_name, email').eq('id', r.user_id).single()
    if (profile.data?.email) {
      const h = await headers()
      const host = h.get('x-forwarded-host') || h.get('host') || ''
      const proto = h.get('x-forwarded-proto') || 'https'
      const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : undefined)
      await sendWelcomeEmail(profile.data.email, profile.data.full_name || 'there', origin)
    }
  } catch (e) {
    console.error('Welcome email failed:', e)
  }

  return { ok: true, email: updated.user.email || '' }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
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
              <Button className="w-full gap-2">
                Sign in <ArrowRight className="w-4 h-4" />
              </Button>
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
            <Link href="/login">
              <Button className="w-full">Go to Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">Create a new account</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
