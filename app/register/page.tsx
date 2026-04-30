"use client"
import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FimiLogo } from '@/components/Logo'
import { UserPlus, Eye, EyeOff, ArrowRight, Mail, Camera, CheckCircle2, ChevronRight, ChevronLeft, ShoppingBag, Wrench, Home, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SPECIALISATIONS } from '@/lib/nigeria-data'

const SPECIALISATION_ICONS = {
  ShoppingBag,
  Wrench,
  Home,
  Briefcase,
} as const

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const STEP_LABELS = ['Your Info', 'Specialisation', 'About You']

export default function RegisterPage() {
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 fields
  const [specialisations, setSpecialisations] = useState<string[]>([])

  // Step 3 fields
  const [bio, setBio] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const supabase = createClient()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const toggleSpecialisation = (id: string) => {
    setSpecialisations(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const validateStep1 = () => {
    if (!fullName.trim()) { toast.error('Please enter your full name'); return false }
    if (!email.trim()) { toast.error('Please enter your email'); return false }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return false }
    if (!dob) { toast.error('Please enter your date of birth'); return false }
    if (!sex) { toast.error('Please select your sex'); return false }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return false }
    return true
  }

  const validateStep2 = () => {
    if (specialisations.length === 0) { toast.error('Please select at least one specialisation'); return false }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const handleComplete = async () => {
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone,
        date_of_birth: dob,
        sex,
        bio,
        specialisations,
      }),
    })

    const result = await res.json().catch(() => ({} as any))

    if (!res.ok || result.error) {
      toast.error(result.error || 'Could not create your account')
      setLoading(false)
      return
    }

    // Upload avatar if provided (uses anon client; storage policy allows authenticated uploads)
    if (avatarFile && result.userId) {
      try {
        // Sign in briefly to upload avatar under the user's session
        const { data: signIn } = await supabase.auth.signInWithPassword({ email, password })
        if (signIn?.user) {
          const ext = avatarFile.name.split('.').pop()
          const path = `avatars/${signIn.user.id}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('ad-media')
            .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('ad-media').getPublicUrl(path)
            await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', signIn.user.id)
          }
          await supabase.auth.signOut()
        }
      } catch (e) {
        console.error('Avatar upload failed:', e)
      }
    }

    if (result.warning) {
      toast.warning(result.warning)
    }

    setRegisteredEmail(email)
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-3xl p-10 shadow-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email!</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We sent a verification link to <strong>{registeredEmail}</strong>. Click it to activate your account and start posting.
            </p>
            <div className="bg-primary/5 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs font-semibold text-primary">What's next?</p>
              {['Check your inbox (and spam)', 'Click the verification link', 'Start posting on fimihub!'].map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                  {t}
                </div>
              ))}
            </div>
            <Link href="/login">
              <Button className="w-full gap-2"><ArrowRight className="w-4 h-4" /> Go to Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'}`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-12 h-0.5 mb-4 sm:mb-0 rounded-full transition-all duration-300 ${step > n ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="glass rounded-3xl p-7 shadow-md">
          <FimiLogo className="lg:hidden mx-auto mb-4 w-12 h-12" />

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); handleNext() }}>
              <h2 className="text-xl font-bold mb-1">Create your account</h2>
              <p className="text-sm text-muted-foreground mb-5">Free forever. No credit card needed.</p>

              {/* Avatar upload */}
              <div className="flex justify-center mb-5">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full bg-muted hover:bg-muted/80 transition-all group overflow-hidden border-2 border-dashed border-border hover:border-primary">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className="flex flex-col items-center justify-center h-full gap-1">
                        <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs text-muted-foreground group-hover:text-primary">Photo</span>
                      </div>
                  }
                  {avatarPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <p className="text-center text-xs text-muted-foreground -mt-3 mb-5">Optional profile photo</p>

              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Amara Johnson" value={fullName}
                    onChange={e => setFullName(e.target.value)} className="mt-1.5" autoComplete="name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="mt-1.5" autoComplete="email" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" type="tel" placeholder="+234 800 000 0000" value={phone}
                    onChange={e => setPhone(e.target.value)} className="mt-1.5" autoComplete="tel" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input id="dob" type="date" value={dob}
                      onChange={e => setDob(e.target.value)}
                      max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="sex">Sex</Label>
                    <select id="sex" value={sex} onChange={e => setSex(e.target.value)} required
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <option value="" disabled>Select…</option>
                      {SEX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
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
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative mt-1.5">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat your password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className={`pr-10 ${confirmPassword && confirmPassword !== password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      autoComplete="new-password" required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>
                <Button type="submit" size="lg" className="w-full gap-2 mt-1">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Specialisation ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1">What are you here for?</h2>
              <p className="text-sm text-muted-foreground mb-5">Select all that apply — you can change this later.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SPECIALISATIONS.map(s => {
                  const selected = specialisations.includes(s.id)
                  const Icon = SPECIALISATION_ICONS[s.icon as keyof typeof SPECIALISATION_ICONS]
                  return (
                    <button key={s.id} type="button" onClick={() => toggleSpecialisation(s.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/40'}`}>
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className={`text-sm font-semibold ${selected ? 'text-primary' : ''}`}>{s.label}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{s.desc}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleNext}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Bio ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1">Tell us about yourself</h2>
              <p className="text-sm text-muted-foreground mb-5">A short bio helps buyers and sellers trust you more.</p>
              <div className="mb-6">
                <Label htmlFor="bio">Bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="E.g. I'm a Lagos-based seller of quality electronics. Fast delivery, trusted by 200+ buyers..."
                  rows={5}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/300</p>
              </div>

              {/* Summary card */}
              <div className="bg-muted/40 rounded-2xl p-4 mb-5 space-y-2 text-sm">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Your account summary</p>
                <div className="flex items-center gap-2">
                  {avatarPreview
                    ? <img src={avatarPreview} className="w-8 h-8 rounded-full object-cover" alt="" />
                    : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{fullName.charAt(0).toUpperCase()}</div>
                  }
                  <div>
                    <p className="font-semibold">{fullName}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">Interested in: <span className="text-foreground font-medium">{specialisations.map(id => SPECIALISATIONS.find(s => s.id === id)?.label).join(', ')}</span></p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleComplete} disabled={loading}>
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                    : <><UserPlus className="w-4 h-4" /> Complete</>
                  }
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
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
  )
}
