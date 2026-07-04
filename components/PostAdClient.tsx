"use client"
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ImagePlus, X, Video, Loader2, ShoppingBag, Wrench, Home, Briefcase } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import type { MediaItem } from '@/lib/supabase/types'

const CATEGORIES = [
  { id: 'products', label: 'Products', description: 'Buy & sell items', icon: ShoppingBag },
  { id: 'services', label: 'Services & Skills', description: 'Hire or offer expertise', icon: Wrench },
  { id: 'rentals', label: 'Rentals', description: 'Homes, rooms & spaces', icon: Home },
  { id: 'business', label: 'Business & Brands', description: 'Promote your business', icon: Briefcase },
]
const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'free', label: 'Free' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'per_hour', label: 'Per Hour' },
]

interface Props {
  userId: string
  userEmail: string
  credits: number
  hasPayoutAccount: boolean
  freePostsRemaining: number
  postCostCredits: number
}

interface UploadFile {
  file: File
  preview: string
  type: 'image' | 'video'
  uploading?: boolean
  url?: string
  error?: string
}

export default function PostAdClient({ userId, userEmail, credits, hasPayoutAccount, freePostsRemaining, postCostCredits }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploads, setUploads] = useState<UploadFile[]>([])

  const isFree = freePostsRemaining > 0
  const canPayWithCredits = credits >= postCostCredits
  const canPost = isFree || canPayWithCredits

  const [form, setForm] = useState({
    title: '', category: '', description: '', price: '',
    priceType: 'fixed', location: '', contactEmail: userEmail,
    contactPhone: '', tags: '', quantity: '', acceptPayments: false,
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const step1Valid = form.title && form.category
  const step2Valid = form.description && form.location && form.contactEmail

  const onDrop = useCallback((accepted: File[]) => {
    const newUploads: UploadFile[] = accepted.slice(0, 10 - uploads.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }))
    setUploads(prev => [...prev, ...newUploads])
  }, [uploads.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 50 * 1024 * 1024,
    disabled: uploads.length >= 10,
  })

  const removeUpload = (idx: number) => {
    setUploads(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[idx].preview)
      next.splice(idx, 1)
      return next
    })
  }

  const uploadMedia = async (): Promise<MediaItem[]> => {
    const results: MediaItem[] = []
    const updated = [...uploads]

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], uploading: true }
      setUploads([...updated])

      try {
        const form = new FormData()
        form.append('file', updated[i].file)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
        const { url, type } = await res.json()
        updated[i] = { ...updated[i], uploading: false, url }
        results.push({ url, type })
      } catch (e: any) {
        updated[i] = { ...updated[i], uploading: false, error: e.message }
        toast.error(`Failed to upload ${updated[i].file.name}`)
      }
      setUploads([...updated])
    }
    return results
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canPost) { toast.error('You need credits to post'); return }
    setLoading(true)

    try {
      const media = await uploadMedia()

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          price: form.priceType !== 'free' && form.price ? Number(form.price) : null,
          price_type: form.priceType,
          location: form.location,
          contact_email: form.contactEmail,
          contact_phone: form.contactPhone || null,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          media,
          quantity: form.quantity ? parseInt(form.quantity, 10) : null,
          accept_payments: form.acceptPayments,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to create ad')
      }

      setSubmitted(true)
      toast.success('Ad posted successfully!')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      toast.error(err.message || 'Failed to post ad')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <div className="glass rounded-3xl p-10 shadow-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ad Posted!</h1>
          <p className="text-muted-foreground">Your ad space is now live on FimiHub.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Post an Ad Space</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isFree ? `${freePostsRemaining} free post${freePostsRemaining !== 1 ? 's' : ''} remaining` : `${postCostCredits} credits per post · ${credits} credits available`}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3].map(s => (
          <div key={s} className={`flex items-center gap-2 ${s < 3 ? 'flex-1' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1 — Category & Title */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Category</Label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => set('category', cat.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${form.category === cat.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <cat.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="title">Ad Title</Label>
              <Input id="title" placeholder="e.g. MacBook Pro M3, Logo Design Service…" value={form.title} onChange={e => set('title', e.target.value)} className="mt-1.5" required />
            </div>
            <Button type="button" className="w-full" disabled={!step1Valid} onClick={() => setStep(2)}>Continue →</Button>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your ad space in detail…" value={form.description} onChange={e => set('description', e.target.value)} className="mt-1.5" rows={5} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price-type">Price Type</Label>
                <select id="price-type" className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priceType} onChange={e => set('priceType', e.target.value)}>
                  {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              {form.priceType !== 'free' && (
                <div>
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input id="price" type="number" placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} className="mt-1.5" min="0" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Lagos, Abuja…" value={form.location} onChange={e => set('location', e.target.value)} className="mt-1.5" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="contact-phone">Phone (optional)</Label>
                <Input id="contact-phone" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
              <Input id="tags" placeholder="e.g. laptop, MacBook, M3" value={form.tags} onChange={e => set('tags', e.target.value)} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity">Quantity (optional)</Label>
                <Input id="quantity" type="number" min="1" placeholder="Stock count" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="mt-1.5" />
              </div>
              <div className="flex items-center gap-2 mt-7">
                <input type="checkbox" id="accept-payments" checked={form.acceptPayments} onChange={e => set('acceptPayments', e.target.checked)} className="rounded" />
                <Label htmlFor="accept-payments" className="cursor-pointer">Accept Payments</Label>
              </div>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button type="button" disabled={!step2Valid} onClick={() => setStep(3)}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3 — Media & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Media upload */}
            <div>
              <Label className="mb-2 block">Photos / Videos (optional, max 10)</Label>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <input {...getInputProps()} />
                <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{isDragActive ? 'Drop files here…' : 'Drag & drop or click to upload'}</p>
                <p className="text-xs text-muted-foreground mt-1">Images & videos up to 50 MB each</p>
              </div>
              {uploads.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {uploads.map((u, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-muted">
                      {u.type === 'image' ? (
                        <img src={u.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/80">
                          <Video className="w-8 h-8 text-white/70" />
                        </div>
                      )}
                      {u.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                      <button type="button" onClick={() => removeUpload(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">Cover</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review */}
            <div className="glass rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-sm mb-3">Review your ad space</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium truncate max-w-[200px]">{form.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{CATEGORIES.find(c => c.id === form.category)?.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price Type</span><span>{form.priceType}</span></div>
                {form.priceType !== 'free' && form.price && <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span>₦{Number(form.price).toLocaleString()}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{form.location}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Media</span><span>{uploads.length} file(s)</span></div>
                {!isFree && <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="text-amber-600 font-medium">{postCostCredits} credits</span></div>}
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button type="submit" disabled={loading || !canPost} className="gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : 'Post Ad Space'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
