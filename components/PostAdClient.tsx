"use client"
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ImagePlus, X, Video, Images, Loader2, ShoppingBag, Wrench, Home, Briefcase } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
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
}

interface UploadFile {
  file: File
  preview: string
  type: 'image' | 'video'
  uploading?: boolean
  url?: string
  error?: string
}

export default function PostAdClient({ userId, userEmail, credits }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploads, setUploads] = useState<UploadFile[]>([])

  const [form, setForm] = useState({
    title: '', category: '', description: '', price: '',
    priceType: 'fixed', location: '', contactEmail: userEmail,
    contactPhone: '', tags: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const step1Valid = form.title && form.category
  const step2Valid = form.description && form.location && form.contactEmail
  const supabase = createClient()

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
      const u = updated[i]
      updated[i] = { ...u, uploading: true }
      setUploads([...updated])

      const ext = u.file.name.split('.').pop()
      const path = `${userId}/${uuidv4()}.${ext}`

      const { error } = await supabase.storage
        .from('ad-media')
        .upload(path, u.file, { contentType: u.file.type, upsert: false })

      if (error) {
        updated[i] = { ...updated[i], uploading: false, error: error.message }
        setUploads([...updated])
        toast.error(`Failed to upload ${u.file.name}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('ad-media').getPublicUrl(path)
      updated[i] = { ...updated[i], uploading: false, url: publicUrl }
      setUploads([...updated])
      results.push({ url: publicUrl, type: u.type })
    }

    return results
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let media: MediaItem[] = []
    if (uploads.length > 0) {
      media = await uploadMedia()
    }

    const tags = form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)

    const { error } = await supabase.from('ads').insert({
      user_id: userId,
      title: form.title,
      description: form.description,
      category: form.category as any,
      price: form.priceType === 'free' ? null : form.price ? Number(form.price) : null,
      price_type: form.priceType as any,
      location: form.location,
      contact_email: form.contactEmail,
      contact_phone: form.contactPhone || null,
      status: 'active',
      media,
      tags,
      boost_expires_at: null,
    })

    setLoading(false)
    if (error) {
      toast.error('Failed to post ad space. Please try again.')
      return
    }
    setSubmitted(true)
    toast.success('Your ad space is now live!')
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <div className="glass rounded-3xl p-10 shadow-md animate-in-up">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
          <h1 className="text-2xl font-bold mb-2">Ad Space is Live!</h1>
          <p className="text-muted-foreground mb-6">Your ad space has been posted and is now visible to thousands of buyers.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/')}>Browse Marketplace</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>My Dashboard</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Post an Ad Space</h1>
        <p className="text-muted-foreground text-sm mt-1">Reach thousands of potential buyers, clients, and renters.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
            <span className={`text-sm whitespace-nowrap ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Details' : s === 2 ? 'Description' : 'Media & Review'}
            </span>
            {s < 3 && <div className={`h-px w-8 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-5 animate-in-up">
            <div>
              <Label htmlFor="title">Ad Space Title *</Label>
              <Input id="title" placeholder="e.g. iPhone 14 Pro Max 256GB for sale" value={form.title}
                onChange={e => set('title', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Category *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {CATEGORIES.map(cat => (
                  <button type="button" key={cat.id} onClick={() => set('category', cat.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${form.category === cat.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50 glass'}`}>
                    <cat.icon className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceType">Price Type</Label>
                <select id="priceType" value={form.priceType} onChange={e => set('priceType', e.target.value)}
                  className="mt-1.5 w-full text-sm border border-border/70 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              {form.priceType !== 'free' && (
                <div>
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input id="price" type="number" placeholder="e.g. 250000" value={form.price}
                    onChange={e => set('price', e.target.value)} className="mt-1.5" />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="button" disabled={!step1Valid} onClick={() => setStep(2)}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in-up">
            <div>
              <Label htmlFor="desc">Description *</Label>
              <Textarea id="desc" placeholder="Describe your ad space in detail — condition, features, requirements, etc."
                value={form.description} onChange={e => set('description', e.target.value)} className="mt-1.5 min-h-[140px]" />
              <p className="text-xs text-muted-foreground mt-1">{form.description.length} characters</p>
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="e.g. Lagos, Nigeria or Remote" value={form.location}
                onChange={e => set('location', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Contact Email *</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={form.contactEmail}
                onChange={e => set('contactEmail', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" type="tel" placeholder="+234 800 000 0000" value={form.contactPhone}
                onChange={e => set('contactPhone', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" placeholder="laptop, apple, macbook, tech" value={form.tags}
                onChange={e => set('tags', e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" disabled={!step2Valid} onClick={() => setStep(3)}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in-up">
            <div>
              <Label>Upload Images, Videos or Album</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Supported: JPG, PNG, GIF, MP4, MOV — up to 10 files, 50MB each.
                Multiple images = album view automatically.
              </p>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'} ${uploads.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-3 mb-3">
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <Images className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{isDragActive ? 'Drop files here…' : 'Drop files or click to upload'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploads.length > 0 ? `${uploads.length} file(s) selected` : 'Images, videos, or create an album with multiple images'}
                </p>
              </div>

              {uploads.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {uploads.map((u, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
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
                {form.priceType !== 'free' && form.price && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span>₦{Number(form.price).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{form.location}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Media</span><span>{uploads.length} file(s){uploads.length > 1 ? ' (album)' : ''}</span></div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : 'Post Ad Space'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
