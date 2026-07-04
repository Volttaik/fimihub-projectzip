"use client"
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FimiLogo } from '@/components/Logo'
import { LogIn, Eye, EyeOff, ArrowRight, ShoppingBag, Home, Wrench, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

const previewListings = [
  { icon: ShoppingBag, label: 'MacBook Pro M3', price: '₦2,200,000', color: 'bg-primary/10 text-primary' },
  { icon: Home, label: '2BR — Victoria Island', price: '₦850,000/mo', color: 'bg-accent/15 text-foreground' },
  { icon: Wrench, label: 'Logo Design Service', price: '₦85,000', color: 'bg-primary/10 text-primary' },
  { icon: Briefcase, label: 'ZapFit Gym Promo', price: '₦25,000/mo', color: 'bg-accent/15 text-foreground' },
]

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'email_not_confirmed') {
          toast.error('Please verify your email before signing in.', {
            action: {
              label: 'Resend email',
              onClick: async () => {
                await fetch('/api/auth/resend-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
                toast.success('Verification email sent')
              },
            },
          })
        } else {
          toast.error(data.error || 'Login failed')
        }
        return
      }
      router.push(redirect)
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left — preview */}
      <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-primary/5 via-background to-accent/10 flex-1">
        <div className="max-w-xs">
          <h2 className="text-2xl font-bold mb-2">FimiHub Marketplace</h2>
          <p className="text-muted-foreground text-sm mb-8">Discover products, services, rentals & businesses from verified sellers.</p>
          <div className="space-y-3">
            {previewListings.map((item, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="glass rounded-3xl p-8 shadow-md animate-in-up">
            <div className="text-center mb-7">
              <FimiLogo className="mx-auto w-14 h-14 rounded-2xl" />
              <h1 className="text-2xl font-bold mt-4 mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your FimiHub account</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Your password"
                    value={password} onChange={e => setPassword(e.target.value)} className="pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full gap-2 mt-1" disabled={loading}>
                {loading ? 'Signing in…' : <><LogIn className="w-4 h-4" /> Sign in</>}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">Create one <ArrowRight className="inline w-3 h-3" /></Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
