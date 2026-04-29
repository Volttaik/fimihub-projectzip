"use client"
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Loader2,
  ImagePlus,
  Video,
  X,
  CreditCard,
  ClipboardList,
  Truck,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Ad, MediaItem } from '@/lib/supabase/types'

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'free', label: 'Free' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'per_hour', label: 'Per Hour' },
]

interface Props {
  ad: Ad
  hasPayoutAccount: boolean
}

interface NewUpload {
  file: File
  preview: string
  type: 'image' | 'video'
  uploading?: boolean
}

export default function EditAdClient({ ad, hasPayoutAccount }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: ad.title,
    description: ad.description,
    price: ad.price ? String(ad.price) : '',
    priceType: ad.price_type,
    location: ad.location,
    contactEmail: ad.contact_email,
    contactPhone: ad.contact_phone || '',
    tags: (ad.tags || []).join(', '),
    quantity: ad.quantity != null ? String(ad.quantity) : '',
    fulfillmentMode: (ad.accept_payments ? 'payment' : 'order') as 'payment' | 'order',
    requiresShipping: !!ad.requires_shipping,
  })
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const [existingMedia, setExistingMedia] = useState<MediaItem[]>(ad.media || [])
  const [newUploads, setNewUploads] = useState<NewUpload[]>([])

  const onDrop = useCallback(
    (accepted: File[]) => {
      const room = 10 - existingMedia.length - newUploads.length
      const next: NewUpload[] = accepted.slice(0, Math.max(0, room)).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
      }))
      setNewUploads((p) => [...p, ...next])
    },
    [existingMedia.length, newUploads.length]
  )
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 50 * 1024 * 1024,
    disabled: existingMedia.length + newUploads.length >= 10,
  })

  const removeExisting = (idx: number) =>
    setExistingMedia((m) => m.filter((_, i) => i !== idx))
  const removeNew = (idx: number) =>
    setNewUploads((p) => {
      const copy = [...p]
      URL.revokeObjectURL(copy[idx].preview)
      copy.splice(idx, 1)
      return copy
    })

  const uploadNew = async (): Promise<MediaItem[]> => {
    const out: MediaItem[] = []
    for (const u of newUploads) {
      const ext = u.file.name.split('.').pop()
      const path = `${ad.user_id}/${uuidv4()}.${ext}`
      const { error } = await supabase.storage
        .from('ad-media')
        .upload(path, u.file, { contentType: u.file.type, upsert: false })
      if (error) {
        toast.error(`Failed to upload ${u.file.name}`)
        continue
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('ad-media').getPublicUrl(path)
      out.push({ url: publicUrl, type: u.type })
    }
    return out
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.location || !form.contactEmail) {
      toast.error('Please fill in all required fields')
      return
    }
    if (form.fulfillmentMode === 'payment' && !hasPayoutAccount) {
      toast.error('Connect a bank account before enabling payments')
      return
    }
    setSaving(true)
    try {
      const newlyUploaded = newUploads.length > 0 ? await uploadNew() : []
      const finalMedia: MediaItem[] = [...existingMedia, ...newlyUploaded]
      const tags = form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)

      const { error } = await supabase
        .from('ads')
        .update({
          title: form.title,
          description: form.description,
          price:
            form.priceType === 'free'
              ? null
              : form.price
              ? Number(form.price)
              : null,
          price_type: form.priceType as any,
          location: form.location,
          contact_email: form.contactEmail,
          contact_phone: form.contactPhone || null,
          tags,
          quantity: form.quantity ? Number(form.quantity) : null,
          media: finalMedia,
          accept_payments: form.fulfillmentMode === 'payment' && hasPayoutAccount,
          requires_shipping:
            form.fulfillmentMode === 'payment' && form.requiresShipping,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', ad.id)
      if (error) throw error
      toast.success('Ad updated')
      router.push(`/ad/${ad.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href={`/ad/${ad.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to ad
      </Link>

      <h1 className="text-2xl font-bold mb-1">Edit ad</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Update your listing details, media, and how buyers can pay or order.
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="desc">Description *</Label>
          <Textarea
            id="desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="mt-1.5 min-h-[140px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priceType">Price type</Label>
            <select
              id="priceType"
              value={form.priceType}
              onChange={(e) => set('priceType', e.target.value)}
              className="mt-1.5 w-full text-sm border border-border/70 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PRICE_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {form.priceType !== 'free' && (
            <div>
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="qty">Stock (optional)</Label>
            <Input
              id="qty"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ce">Contact email *</Label>
            <Input
              id="ce"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cp">Contact phone</Label>
            <Input
              id="cp"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => set('contactPhone', e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            className="mt-1.5"
          />
        </div>

        {/* Fulfillment mode — Payment OR Order */}
        <div className="rounded-2xl border border-border p-4 space-y-3 bg-muted/30">
          <div>
            <p className="font-semibold text-sm">How buyers complete this listing</p>
            <p className="text-xs text-muted-foreground">
              Choose one — buyers either pay you directly through Paystack, or place an order
              and chat with you to arrange payment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => set('fulfillmentMode', 'payment')}
              className={`text-left rounded-xl border p-3 transition-all ${
                form.fulfillmentMode === 'payment'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                <CreditCard className="w-4 h-4 text-primary" /> Payment button
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Buyers see a Buy Now button and pay you on Paystack. 5% platform fee applies.
              </p>
            </button>
            <button
              type="button"
              onClick={() => set('fulfillmentMode', 'order')}
              className={`text-left rounded-xl border p-3 transition-all ${
                form.fulfillmentMode === 'order'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                <ClipboardList className="w-4 h-4 text-primary" /> Order button
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Buyers place an order request, you chat in Inbox to confirm and arrange payment.
              </p>
            </button>
          </div>

          {form.fulfillmentMode === 'payment' && !hasPayoutAccount && (
            <a
              href="/bank-account"
              className="text-xs text-primary hover:underline block"
            >
              Connect a bank account to enable payments →
            </a>
          )}

          {form.fulfillmentMode === 'payment' && (
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.requiresShipping}
                onChange={(e) => set('requiresShipping', e.target.checked)}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary" /> This product needs shipping
                </span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  Buyers will be asked for their full delivery address before they pay. Leave
                  off for digital items, services, or buyer pickup.
                </span>
              </span>
            </label>
          )}
        </div>

        {/* Media */}
        <div>
          <Label>Photos & video</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {existingMedia.map((m, i) => (
              <div
                key={`ex-${i}`}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                {m.type === 'image' ? (
                  <Image src={m.url} alt="" fill sizes="120px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/80">
                    <Video className="w-6 h-6 text-white/70" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeExisting(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {newUploads.map((u, i) => (
              <div
                key={`nu-${i}`}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group ring-1 ring-primary/40"
              >
                {u.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/80">
                    <Video className="w-6 h-6 text-white/70" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] bg-primary/90 text-primary-foreground px-1.5 rounded">
                  New
                </span>
              </div>
            ))}
            {existingMedia.length + newUploads.length < 10 && (
              <div
                {...getRootProps()}
                className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <input {...getInputProps()} />
                <ImagePlus className="w-5 h-5 mb-1" />
                <span className="text-[11px]">Add</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Up to 10 files total. JPG, PNG, MP4, MOV — 50 MB each.
          </p>
        </div>

        <div className="flex justify-between pt-2">
          <Link href={`/ad/${ad.id}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
