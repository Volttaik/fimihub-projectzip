"use client"
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FimiLogo } from '@/components/Logo'
import { KeyRound, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="glass rounded-3xl p-7 shadow-md text-center">
          <FimiLogo className="mx-auto w-14 h-14 rounded-2xl" />
          <h1 className="text-2xl font-bold mt-4 mb-2">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground mb-5">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link href="/login">
            <Button className="w-full gap-2"><ArrowRight className="w-4 h-4" /> Back to login</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) { toast.error('Please fill in both fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not reset password')
        setLoading(false)
        return
      }
      setDone(true)
      toast.success('Password updated! You can now sign in.')
      setTimeout(() => router.push('/login'), 1800)
    } catch (err) {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="glass rounded-3xl p-7 shadow-md text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mt-4 mb-2">Password updated</h1>
          <p className="text-sm text-muted-foreground mb-5">
            You can now sign in with your new password.
          </p>
          <Link href="/login">
            <Button className="w-full gap-2"><ArrowRight className="w-4 h-4" /> Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="glass rounded-3xl p-7 shadow-md animate-in-up">
        <div className="text-center mb-7">
          <FimiLogo className="mx-auto w-14 h-14 rounded-2xl" />
          <h1 className="text-2xl font-bold mt-4 mb-1">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">Pick something secure you'll remember.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <div className="relative mt-1.5">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters"
                value={password} onChange={e => setPassword(e.target.value)} className="pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1.5" required />
          </div>
          <Button type="submit" size="lg" className="w-full gap-2 mt-1" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</span>
            ) : (
              <><KeyRound className="w-4 h-4" /> Update password</>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remembered it?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-2">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <Suspense fallback={null}>
        <ResetPasswordInner />
      </Suspense>
    </div>
  )
}
