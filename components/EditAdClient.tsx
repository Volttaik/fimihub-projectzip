"use client"
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ImagePlus, X, Video, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import type { Ad, MediaItem } from '@/lib/supabase/types'

const CATEGORIES = [
  { id: 'products', label: 'Products' },
  { id: 'services', label: 'Services & Skills' },
  { id: 'rentals', label: 'Rentals' },
  { id: 'business', label: 'Business & Brands' },
]
const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'free', label: 'Free' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'per_hour', label: 'Per Hour' },
]

interface UploadFile {
  file?: File
  preview: string
  type: 'image' | 'video'
  uploading?: boolean
  url?: string
  existing?: boolean
}

interface Props {
  ad: Ad
  hasPayoutAccount: boolean
}

export default function EditAdClient({ ad, hasPayoutAccount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    title: ad.title,
    category: ad.category,
    description: ad.description,
    price: ad.price?.toString() ?? '',
    priceType: ad.price_type,
    location: ad.location,
    contactEmail: ad.contact_email,
    contactPhone: ad.contact_phone ?? '',
    tags: ad.tags?.join(', ') ?? '',
    quantity: ad.quantity?.toString() ?? '',
    acceptPayments: ad.accept_payments,
    requiresShipping: ad.requires_shipping,
  })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const [uploads, setUploads] = useState<UploadFile[]>(
    (ad.media || []).map(m => ({ preview: m.url, type: m.type, url: m.url, existing: true }))
  )

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
      if (!next[idx].existing && next[idx].preview) URL.revokeObjectURL(next[idx].preview)
      next.splice(idx, 1)
      return next
    })
  }

  const uploadNewMedia = async (): Promise<MediaItem[]> => {
    const results: MediaItem[] = []
    const updated = [...uploads]

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].existing) {
        results.push({ url: updated[i].url!, type: updated[i].type })
        continue
      }
      updated[i] = { ...updated[i], uploading: true }
      setUploads([...updated])

      try {
        const form = new FormData()
        form.append('file', updated[i].file!)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
        const { url, type } = await res.json()
        updated[i] = { ...updated[i], uploading: false, url }
        results.push({ url, type })
      } catch (e: any) {
        updated[i] = { ...updated[i], uploading: false }
        toast.error(`Failed to upload ${updated[i].file?.name}`)
      }
      setUploads([...updated])
    }
    return results
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const media = await uploadNewMedia()
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: 'PATCH',
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
          tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          media,
          quantity: form.quantity ? parseInt(form.quantity, 10) : null,
          accept_payments: form.acceptPayments,
          requires_shipping: form.requiresShipping,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update ad')
      setDone(true)
      toast.success('Ad updated!')
      setTimeout(() => router.push(`/ad/${ad.id}`), 1200)
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <div className="glass rounded-3xl p-10"><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" /><h1 className="text-xl font-bold">Ad Updated!</h1></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Ad Space</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label>Category</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => set('category', cat.id)}
                className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${form.category === cat.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} className="mt-1.5" required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={e => set('description', e.target.value)} className="mt-1.5" rows={5} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Price Type</Label>
            <select className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priceType} onChange={e => set('priceType', e.target.value)}>
              {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {form.priceType !== 'free' && (
            <div>
              <Label htmlFor="price">Price (₦)</Label>
              <Input id="price" type="number" value={form.price} onChange={e => set('price', e.target.value)} className="mt-1.5" min="0" />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={form.location} onChange={e => set('location', e.target.value)} className="mt-1.5" required />
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
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={form.tags} onChange={e => set('tags', e.target.value)} className="mt-1.5" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="mt-1.5" />
          </div>
          <div className="space-y-2 mt-7">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.acceptPayments} onChange={e => set('acceptPayments', e.target.checked)} className="rounded" />
              <span className="text-sm">Accept Payments</span>
            </label>
            {form.acceptPayments && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresShipping} onChange={e => set('requiresShipping', e.target.checked)} className="rounded" />
                <span className="text-sm">Requires Shipping</span>
              </label>
            )}
          </div>
        </div>

        {/* Media */}
        <div>
          <Label className="mb-2 block">Photos / Videos (max 10)</Label>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
            <input {...getInputProps()} />
            <ImagePlus className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drag & drop or click to add more media</p>
          </div>
          {uploads.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {uploads.map((u, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-muted">
                  {u.type === 'image' ? <img src={u.preview} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-black/80"><Video className="w-6 h-6 text-white/70" /></div>}
                  {u.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
                  <button type="button" onClick={() => removeUpload(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">Cover</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
