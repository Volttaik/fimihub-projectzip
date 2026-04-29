"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MapPin, Eye, Heart, Share2, Phone, Mail, ChevronLeft, ChevronRight, BadgeCheck, Zap, Calendar, ArrowLeft, ShoppingCart, Package, Loader2, MessageSquarePlus, CheckCircle2, Minus, Plus, ClipboardList, MessageCircle, Images, PlayCircle, Tag } from 'lucide-react'
import type { Ad } from '@/lib/supabase/types'
import { formatPrice, timeAgo, getInitials } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const categoryColors: Record<string, string> = {
  products: 'bg-primary/10 text-primary',
  services: 'bg-primary/10 text-primary',
  rentals: 'bg-emerald-100 text-emerald-700',
  business: 'bg-accent/15 text-accent-foreground',
}

interface Props {
  ad: Ad
  similar: Ad[]
  currentUserId: string | null
}

export default function AdDetailClient({ ad, similar, currentUserId }: Props) {
  const router = useRouter()
  const [mediaIdx, setMediaIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const media = ad.media || []
  const currentMedia = media[mediaIdx]
  const supabase = createClient()

  // Buy / checkout state
  const [qty, setQty] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  // Place order state
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderQty, setOrderQty] = useState(1)
  const [orderNote, setOrderNote] = useState('')
  const [orderPhone, setOrderPhone] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)

  // Message seller
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgBody, setMsgBody] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)

  // Custom request state
  const [reqOpen, setReqOpen] = useState(false)
  const [reqName, setReqName] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqPhone, setReqPhone] = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [reqBudget, setReqBudget] = useState('')
  const [reqQty, setReqQty] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSent, setReqSent] = useState(false)

  const stockLeft = typeof ad.quantity === 'number' ? ad.quantity : null
  const canBuy = ad.accept_payments && !!ad.price && (stockLeft === null || stockLeft > 0)
  const canOrder = ad.user_id !== currentUserId && (stockLeft === null || stockLeft > 0)
  const maxQty = stockLeft ?? 99

  const requireLogin = (action: string) => {
    if (currentUserId) return true
    toast.error(`Sign in to ${action}`)
    router.push(`/login?redirect=/ad/${ad.id}`)
    return false
  }

  const startCheckout = () => {
    if (!requireLogin('buy this item')) return
    setShowCheckout(true)
  }

  const startPlaceOrder = () => {
    if (!requireLogin('place an order')) return
    setOrderOpen(true)
  }

  const startMessage = () => {
    if (!requireLogin('message the seller')) return
    setMsgOpen(true)
  }

  const startCustomRequest = () => {
    if (!requireLogin('send a request')) return
    setReqOpen(true)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderLoading(true)
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          quantity: orderQty,
          note: orderNote,
          buyer_phone: orderPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not place order')
      toast.success('Order placed — opening chat with seller')
      router.push(`/inbox/${data.conversation_id}`)
    } catch (err: any) {
      toast.error(err.message)
      setOrderLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgBody.trim()) return
    setMsgLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, body: msgBody.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send message')
      toast.success('Message sent')
      router.push(`/inbox/${data.conversation_id}`)
    } catch (err: any) {
      toast.error(err.message)
      setMsgLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!buyerName || !buyerEmail) { toast.error('Please fill in your details'); return }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          quantity: qty,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_phone: buyerPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.authorization_url
    } catch (e: any) {
      toast.error(e.message)
      setCheckoutLoading(false)
    }
  }

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName || !reqEmail || !reqMessage) return
    setReqLoading(true)
    try {
      const res = await fetch('/api/custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          buyer_name: reqName,
          buyer_email: reqEmail,
          buyer_phone: reqPhone,
          message: reqMessage,
          budget: reqBudget,
          quantity: reqQty,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setReqSent(true)
      toast.success('Request sent to seller')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setReqLoading(false)
    }
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { requireLogin('save this ad'); return }
    if (saved) {
      await supabase.from('saves').delete().eq('user_id', user.id).eq('ad_id', ad.id)
      setSaved(false)
      toast.success('Removed from saved')
    } else {
      await supabase.from('saves').insert({ user_id: user.id, ad_id: ad.id })
      setSaved(true)
      toast.success('Saved!')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const posterName = ad.profiles?.full_name || 'FimiHub User'

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Media gallery */}
          {media.length > 0 && (
            <div className="mb-5">
              <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
                {currentMedia?.type === 'video' ? (
                  <video src={currentMedia.url} controls className="w-full h-full object-contain bg-black" />
                ) : currentMedia ? (
                  <Image src={currentMedia.url} alt={ad.title} fill priority className="object-contain" sizes="(max-width: 768px) 100vw, 700px" />
                ) : null}

                {media.length > 1 && (
                  <>
                    <button onClick={() => setMediaIdx(i => (i - 1 + media.length) % media.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setMediaIdx(i => (i + 1) % media.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {media.map((_, i) => (
                        <button key={i} onClick={() => setMediaIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === mediaIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}

                {media.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Images className="w-3 h-3" /> {mediaIdx + 1}/{media.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {media.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {media.map((m, i) => (
                    <button key={i} onClick={() => setMediaIdx(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all ${i === mediaIdx ? 'ring-2 ring-primary ring-offset-1' : 'opacity-60 hover:opacity-100'}`}>
                      {m.type === 'video' ? (
                        <div className="w-full h-full bg-black/80 flex items-center justify-center">
                          <PlayCircle className="w-5 h-5 text-white/70" />
                        </div>
                      ) : (
                        <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ad info */}
          <div className="glass rounded-2xl p-6 mb-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                {ad.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mb-2">
                    <Zap className="w-3 h-3" /> Sponsored
                  </span>
                )}
                <h1 className="text-xl font-bold leading-tight">{ad.title}</h1>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${categoryColors[ad.category] || 'bg-muted text-muted-foreground'}`}>
                {ad.category}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ad.location}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {timeAgo(ad.created_at)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(ad.views || 0).toLocaleString()} views</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <p className="text-2xl font-black text-primary">{formatPrice(ad.price ?? null, ad.price_type)}</p>
              {stockLeft !== null && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                  stockLeft === 0 ? 'bg-red-100 text-red-700' :
                  stockLeft < 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Package className="w-3 h-3" />
                  {stockLeft === 0 ? 'Out of stock' : `${stockLeft} in stock`}
                </span>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{ad.description}</p>

            {(ad.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {ad.tags.map(tag => (
                  <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`}>
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">#{tag}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-8">
            <Button onClick={handleSave} variant="outline" className="gap-2 flex-1">
              <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </Button>
            <Button onClick={handleShare} variant="outline" className="gap-2 flex-1">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>

          {/* Similar ads */}
          {similar.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Similar Ad Spaces</h2>
              <div className="flex flex-col gap-3">
                {similar.map(s => <PostCard key={s.id} ad={s} currentUserId={currentUserId} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — contact card */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {getInitials(posterName)}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-semibold">{posterName}</p>
                  <BadgeCheck className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Member since {new Date(ad.profiles?.created_at || ad.created_at).getFullYear()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Primary actions */}
              {canBuy && !showCheckout && (
                <Button onClick={startCheckout} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </Button>
              )}
              {showCheckout && canBuy && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Secure checkout</p>
                  {stockLeft !== null && stockLeft > 1 && (
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-semibold w-10 text-center">{qty}</span>
                        <button type="button" onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="bn" className="text-xs">Your name *</Label>
                    <Input id="bn" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="be" className="text-xs">Email *</Label>
                    <Input id="be" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="bp" className="text-xs">Phone</Label>
                    <Input id="bp" type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-base">{formatPrice((ad.price || 0) * qty, 'fixed')}</span>
                  </div>
                  <Button onClick={handleCheckout} disabled={checkoutLoading} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                    {checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Pay with Paystack</>}
                  </Button>
                  <button type="button" onClick={() => setShowCheckout(false)} className="text-xs text-muted-foreground w-full text-center hover:underline">
                    Cancel
                  </button>
                </div>
              )}

              {ad.user_id === currentUserId ? (
                <>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5 text-xs text-primary text-center font-medium">
                    This is your ad — buyers see Place Order, Message and Custom Request here.
                  </div>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full gap-2">
                      <ClipboardList className="w-4 h-4" /> Manage in dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {canOrder && (
                    <Button onClick={startPlaceOrder} className="w-full gap-2">
                      <ClipboardList className="w-4 h-4" /> Place Order
                    </Button>
                  )}
                  <Button onClick={startMessage} variant="outline" className="w-full gap-2">
                    <MessageCircle className="w-4 h-4" /> Message Seller
                  </Button>
                  <Button onClick={startCustomRequest} variant="outline" className="w-full gap-2">
                    <MessageSquarePlus className="w-4 h-4" /> Custom Request
                  </Button>
                </>
              )}

              <div className="border-t border-border/60 pt-3 mt-1 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Direct contact</p>
                {ad.contact_phone && (
                  <Button onClick={() => setShowPhone(true)} variant="outline" size="sm" className="w-full gap-2">
                    <Phone className="w-4 h-4" />
                    {showPhone ? ad.contact_phone : 'Show Phone'}
                  </Button>
                )}
                <Button onClick={() => setShowEmail(true)} variant="outline" size="sm" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  {showEmail ? (
                    <a href={`mailto:${ad.contact_email}`} className="text-primary hover:underline truncate">
                      {ad.contact_email}
                    </a>
                  ) : 'Show Email'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reqOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !reqLoading && setReqOpen(false)}>
          <div className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {reqSent ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg">Request sent</h3>
                <p className="text-sm text-muted-foreground mt-1">{posterName} has been notified by email and will reach out to you.</p>
                <Button onClick={() => { setReqOpen(false); setReqSent(false) }} className="mt-5">Done</Button>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-3.5">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-primary" /> Custom request</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tell {posterName} exactly what you need — bulk order, custom variant, special timeline.</p>
                </div>
                <div>
                  <Label htmlFor="rn" className="text-xs">Your name *</Label>
                  <Input id="rn" value={reqName} onChange={e => setReqName(e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="re" className="text-xs">Email *</Label>
                    <Input id="re" type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="rp" className="text-xs">Phone</Label>
                    <Input id="rp" type="tel" value={reqPhone} onChange={e => setReqPhone(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="rq" className="text-xs">Quantity</Label>
                    <Input id="rq" type="number" min={1} value={reqQty} onChange={e => setReqQty(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="rb" className="text-xs">Budget (₦)</Label>
                    <Input id="rb" type="number" min={0} value={reqBudget} onChange={e => setReqBudget(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rm" className="text-xs">Your request *</Label>
                  <Textarea id="rm" value={reqMessage} onChange={e => setReqMessage(e.target.value)}
                    placeholder="e.g. I need 20 units in white, delivered to Lagos by next week."
                    className="mt-1 min-h-[100px]" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setReqOpen(false)} disabled={reqLoading} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={reqLoading || !reqName || !reqEmail || !reqMessage} className="flex-1">
                    {reqLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Sending</> : 'Send request'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Place Order modal */}
      {orderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !orderLoading && setOrderOpen(false)}>
          <div className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Place an order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Send {posterName} an order request. They&apos;ll confirm pricing and delivery in the chat.</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex items-center gap-3">
                {currentMedia?.type === 'image' && (
                  <Image src={currentMedia.url} alt={ad.title} width={56} height={56} className="rounded-lg object-cover w-14 h-14" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{ad.title}</p>
                  {ad.price ? (
                    <p className="text-sm text-primary font-semibold">{formatPrice(ad.price, ad.price_type)}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Price on request</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs">Quantity</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <button type="button" onClick={() => setOrderQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold w-12 text-center">{orderQty}</span>
                  <button type="button" onClick={() => setOrderQty(q => Math.min(maxQty, q + 1))}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                    <Plus className="w-4 h-4" />
                  </button>
                  {stockLeft !== null && (
                    <span className="text-xs text-muted-foreground ml-2">{stockLeft} available</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="op" className="text-xs">Phone (optional)</Label>
                <Input id="op" type="tel" value={orderPhone} onChange={e => setOrderPhone(e.target.value)}
                  placeholder="So the seller can reach you" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="on" className="text-xs">Note to seller (optional)</Label>
                <Textarea id="on" value={orderNote} onChange={e => setOrderNote(e.target.value)}
                  placeholder="Delivery address, color/variant, timing, etc." className="mt-1 min-h-[90px]" />
              </div>

              {ad.price && (
                <div className="flex items-center justify-between text-sm pt-1 border-t border-border/60 pt-3">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-bold text-base">{formatPrice(ad.price * orderQty, 'fixed')}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOrderOpen(false)} disabled={orderLoading} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={orderLoading} className="flex-1 gap-2">
                  {orderLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing</> : <><ClipboardList className="w-4 h-4" /> Place order</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Seller modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !msgLoading && setMsgOpen(false)}>
          <div className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Message {posterName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Start a chat about &ldquo;{ad.title}&rdquo;. Replies show up in your inbox.</p>
              </div>
              <div>
                <Label htmlFor="mb" className="text-xs">Your message *</Label>
                <Textarea id="mb" value={msgBody} onChange={e => setMsgBody(e.target.value)}
                  placeholder="Hi, is this still available?" className="mt-1 min-h-[110px]" autoFocus />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setMsgOpen(false)} disabled={msgLoading} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={msgLoading || !msgBody.trim()} className="flex-1 gap-2">
                  {msgLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending</> : <><MessageCircle className="w-4 h-4" /> Send</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
