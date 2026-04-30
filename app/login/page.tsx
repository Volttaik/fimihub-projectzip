"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FimiLogo } from '@/components/Logo'
import { LogIn, Eye, EyeOff, ArrowRight, ShoppingBag, Home, Wrench, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const previewListings = [
  { icon: ShoppingBag, label: 'MacBook Pro M3', price: '₦2,200,000', color: 'bg-primary/10 text-primary' },
  { icon: Home, label: '2BR — Victoria Island', price: '₦850,000/mo', color: 'bg-accent/15 text-foreground' },
  { icon: Wrench, label: 'Logo Design Service', price: '₦85,000', color: 'bg-primary/10 text-primary' },
  { icon: Briefcase, label: 'ZapFit Gym Promo', price: '₦25,000/mo', color: 'bg-accent/15 text-foreground' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const raw = (error.message || '').toLowerCase()
      const notConfirmed =
        raw.includes('email not confirmed') ||
        raw.includes('not confirmed') ||
        raw.includes('email_not_confirmed') ||
        raw.includes('confirm your email') ||
        raw.includes('email link') ||
        (error as any).code === 'email_not_confirmed'

      if (notConfirmed) {
        // Send a fresh branded verification email pointing at our /verify page
        try {
          await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
        } catch {}
        toast.error('Please verify your email — we just sent you a fresh verification link.', { duration: 6000 })
      } else if (error.message === 'Invalid login credentials') {
        toast.error('Wrong email or password')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
    } else {
      toast.success('Welcome back!')
      router.push(redirect)
      router.refresh()
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { toast.error('Enter your email first'); return }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Could not send reset email')
        return
      }
      toast.success('If that email exists, a reset link is on its way.')
    } catch {
      toast.error('Could not send reset email')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        <div className="hidden lg:flex flex-col gap-5">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-2">Discover what's on<br />FimiHub today</h2>
            <p className="text-muted-foreground leading-relaxed">Thousands of ad spaces, products, services, rentals and businesses — all in one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {previewListings.map(({ icon: Icon, label, price, color }) => (
              <div key={label} className="glass rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold leading-snug">{label}</p>
                <p className="text-sm font-bold text-primary">{price}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Join 50,000+ users already buying, selling and connecting on FimiHub.</p>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
          <div className="glass rounded-3xl p-7 shadow-md animate-in-up">
            <div className="text-center mb-7">
              <FimiLogo className="mx-auto w-14 h-14 rounded-2xl" />
              <h1 className="text-2xl font-bold mt-4 mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your FimiHub account</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} className="mt-1.5" autoComplete="email" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline underline-offset-2">Forgot password?</button>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} className="pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full gap-2 mt-1" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</span>
                ) : (
                  <><LogIn className="w-4 h-4" /> Sign In</>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</Link> &{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            New to FimiHub?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline underline-offset-2 inline-flex items-center gap-0.5">
              Create a free account <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
