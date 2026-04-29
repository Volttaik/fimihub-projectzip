"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FimiLogo } from '@/components/Logo'
import { UserPlus, CheckCircle2, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const perks = [
  'Post unlimited free ad spaces instantly',
  'Manage your listings from your dashboard',
  'Get contacted directly by buyers & clients',
  'Buy credits to boost your ads to the top',
]

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password || !phone || !dob || !sex) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)

    const redirectUrl = `${window.location.origin}/auth/callback?next=/dashboard`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, date_of_birth: dob, sex },
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Save extra profile fields immediately
      await supabase.from('profiles').update({ phone, date_of_birth: dob, sex }).eq('id', data.user.id)

      try {
        await fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: fullName, userId: data.user.id }),
        })
      } catch {}
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center animate-in-up">
          <div className="glass rounded-3xl p-10 shadow-md">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email!</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We sent a verification link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <p className="text-sm text-muted-foreground">
              Already verified?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* Left side — branding */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <FimiLogo />
            <span className="font-bold text-lg">FimiHub</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight mb-3">Join the marketplace<br />built for Africa</h1>
            <p className="text-muted-foreground leading-relaxed">Connect with buyers, sellers, renters, and professionals. Free to join, free to post.</p>
          </div>
          <ul className="space-y-3.5">
            {perks.map(text => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ul>
          <div className="glass rounded-2xl p-4 shadow-sm">
            <div className="flex -space-x-2 mb-2">
              {['A','K','T','J','S'].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-primary border-2 border-card flex items-center justify-center text-primary-foreground text-xs font-bold">{l}</div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">50,000+</span> users across Lagos, Accra, Nairobi & more.
            </p>
          </div>
        </div>

        {/* Right side — form */}
        <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
          <div className="glass rounded-3xl p-7 shadow-md animate-in-up">
            <div className="mb-6">
              <FimiLogo className="lg:hidden mx-auto mb-4 w-12 h-12" />
              <h2 className="text-xl font-bold mb-1">Create your account</h2>
              <p className="text-sm text-muted-foreground">Free forever. No credit card needed.</p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Amara Johnson" value={fullName}
                  onChange={e => setFullName(e.target.value)} className="mt-1.5" autoComplete="name" required />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} className="mt-1.5" autoComplete="email" required />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" placeholder="+234 800 000 0000" value={phone}
                  onChange={e => setPhone(e.target.value)} className="mt-1.5" autoComplete="tel" required />
              </div>

              {/* Date of Birth + Sex side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={dob}
                    onChange={e => setDob(e.target.value)}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <select
                    id="sex"
                    value={sex}
                    onChange={e => setSex(e.target.value)}
                    required
                    className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
                  >
                    <option value="" disabled>Select…</option>
                    {SEX_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} className="pr-10" autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 mt-1" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
              By registering you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-2 inline-flex items-center gap-0.5">
              Sign in <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
