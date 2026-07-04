"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MapPin, Eye, Heart, Phone, Mail, ChevronLeft, ChevronRight, BadgeCheck, Zap, Calendar, ArrowLeft, ShoppingCart, Package, Loader2, MessageSquarePlus, CheckCircle2, Minus, Plus, ClipboardList, Edit2, MessageCircle, Truck, PlayCircle, Images } from 'lucide-react'
import type { Ad } from '@/lib/supabase/types'
import { formatPrice, timeAgo, getInitials } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import CommentsSection from '@/components/CommentsSection'
import ShareMenu from '@/components/ShareMenu'
import { toast } from 'sonner'

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

  const [qty, setQty] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [shipAddress, setShipAddress] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipState, setShipState] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1)

  const [orderOpen, setOrderOpen] = useState(false)
  const [orderQty, setOrderQty] = useState(1)
  const [orderNote, setOrderNote] = useState('')
  const [orderPhone, setOrderPhone] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)

  const [msgOpen, setMsgOpen] = useState(false)
  const [msgBody, setMsgBody] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)

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
  const canOrder = !ad.accept_payments && ad.user_id !== currentUserId && (stockLeft === null || stockLeft > 0)
  const maxQty = stockLeft ?? 99
  const needsShipping = !!ad.requires_shipping

  const requireLogin = (action: string) => {
    if (currentUserId) return true
    toast.error(`Sign in to ${action}`)
    router.push(`/login?redirect=/ad/${ad.id}`)
    return false
  }

  const handleSave = async () => {
    if (!requireLogin('save this ad')) return
    try {
      if (saved) {
        await fetch(`/api/saves?ad_id=${ad.id}`, { method: 'DELETE' })
        setSaved(false)
        toast.success('Removed from saved')
      } else {
        await fetch('/api/saves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ad_id: ad.id }),
        })
        setSaved(true)
        toast.success('Saved!')
      }
    } catch {
      toast.error('Could not update saves')
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderLoading(true)
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, quantity: orderQty, note: orderNote, buyer_phone: orderPhone }),
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
    if (!buyerName || !buyerEmail || !buyerPhone) { toast.error('Please fill in your name, email, and phone'); return }
    if (needsShipping && (!shipAddress || !shipCity || !shipState)) { toast.error('Please add your delivery address'); return }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, quantity: qty, buyer_name: buyerName, buyer_email: buyerEmail, buyer_phone: buyerPhone, shipping_address: needsShipping ? shipAddress : null, shipping_city: needsShipping ? shipCity : null, shipping_state: needsShipping ? shipState : null, delivery_notes: needsShipping ? deliveryNotes : null }),
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
        body: JSON.stringify({ ad_id: ad.id, buyer_name: reqName, buyer_email: reqEmail, buyer_phone: reqPhone, message: reqMessage, budget: reqBudget, quantity: reqQty }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed')
      setReqSent(true)
      toast.success('Request sent!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setReqLoading(false)
    }
  }

  const profile = ad.profiles
  const isOwner = currentUserId === ad.user_id

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {/* Media */}
          {media.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
              {currentMedia?.type === 'video' ? (
                <video src={currentMedia.url} controls className="w-full h-full object-contain" />
              ) : (
                <Image src={currentMedia?.url || ''} alt={ad.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 66vw" />
              )}
              {media.length > 1 && (
                <>
                  <button onClick={() => setMediaIdx(i => (i - 1 + media.length) % media.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setMediaIdx(i => (i + 1) % media.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {media.map((_, i) => (
                      <button key={i} onClick={() => setMediaIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === mediaIdx ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Title + category */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl font-bold leading-tight">{ad.title}</h1>
              <div className="flex gap-1.5 shrink-0">
                <ShareMenu title={ad.title} />
                <button onClick={handleSave} className={`w-8 h-8 rounded-full flex items-center justify-center border ${saved ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'} transition-all`}>
                  <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[ad.category] || 'bg-muted text-muted-foreground'}`}>{ad.category}</span>
              {ad.is_boosted && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⚡ Featured</span>}
              {ad.tags?.map(t => <span key={t} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          </div>

          {/* Price */}
          {ad.price && <div className="text-2xl font-bold text-primary">{formatPrice(ad.price, ad.price_type)}</div>}
          {stockLeft !== null && <p className="text-sm text-muted-foreground">{stockLeft > 0 ? `${stockLeft} available` : 'Out of stock'}</p>}

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{ad.description}</p>
          </div>

          {/* Info */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ad.location}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {ad.views} views</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {timeAgo(ad.created_at)}</span>
          </div>

          {/* Owner edit */}
          {isOwner && (
            <Link href={`/ad/${ad.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5"><Edit2 className="w-3.5 h-3.5" /> Edit this ad</Button>
            </Link>
          )}

          <CommentsSection adId={ad.id} currentUserId={currentUserId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller card */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {getInitials(profile?.full_name || profile?.email || 'U')}
              </div>
              <div>
                <p className="font-semibold text-sm">{profile?.full_name || 'Seller'}</p>
                {profile?.location && <p className="text-xs text-muted-foreground">{profile.location}</p>}
              </div>
            </div>
            <div className="space-y-2">
              {ad.contact_phone && (
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => setShowPhone(!showPhone)}>
                  <Phone className="w-3.5 h-3.5" />
                  {showPhone ? ad.contact_phone : 'Show phone'}
                </Button>
              )}
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => setShowEmail(!showEmail)}>
                <Mail className="w-3.5 h-3.5" />
                {showEmail ? ad.contact_email : 'Show email'}
              </Button>
              {!isOwner && (
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => { if (requireLogin('message the seller')) setMsgOpen(true) }}>
                  <MessageCircle className="w-3.5 h-3.5" /> Message seller
                </Button>
              )}
            </div>
          </div>

          {/* Buy / Order */}
          {!isOwner && (
            <div className="glass rounded-2xl p-5 space-y-3">
              {canBuy && (
                <Button className="w-full gap-2" onClick={() => { if (requireLogin('buy this item')) { setShowCheckout(true); setCheckoutStep(1) } }}>
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </Button>
              )}
              {canOrder && (
                <Button variant="outline" className="w-full gap-2" onClick={() => { if (requireLogin('place an order')) setOrderOpen(true) }}>
                  <Package className="w-4 h-4" /> Place Order
                </Button>
              )}
              {stockLeft === 0 && <p className="text-sm text-center text-muted-foreground">Out of stock</p>}
              <Button variant="ghost" size="sm" className="w-full gap-2" onClick={() => { if (requireLogin('send a request')) setReqOpen(true) }}>
                <ClipboardList className="w-3.5 h-3.5" /> Custom Request
              </Button>
            </div>
          )}

          {/* Checkout dialog */}
          {showCheckout && (
            <div className="glass rounded-2xl p-5 space-y-3 border border-primary/30">
              <h3 className="font-semibold text-sm">Checkout</h3>
              {checkoutStep === 1 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="w-3 h-3" /></Button>
                    <span className="text-sm font-medium w-6 text-center">{qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(q => Math.min(maxQty, q + 1))}><Plus className="w-3 h-3" /></Button>
                  </div>
                  <Input placeholder="Your name" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
                  <Input placeholder="Email" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
                  <Input placeholder="Phone" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />
                  {needsShipping && <>
                    <Input placeholder="Street address" value={shipAddress} onChange={e => setShipAddress(e.target.value)} />
                    <Input placeholder="City" value={shipCity} onChange={e => setShipCity(e.target.value)} />
                    <Input placeholder="State" value={shipState} onChange={e => setShipState(e.target.value)} />
                    <Textarea placeholder="Delivery notes (optional)" value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} rows={2} />
                  </>}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowCheckout(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => setCheckoutStep(2)}>Next →</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm">Paying: <strong>₦{(Number(ad.price) * qty).toLocaleString()}</strong> for {qty}×</p>
                  <p className="text-xs text-muted-foreground">to: {buyerEmail}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCheckoutStep(1)}>← Back</Button>
                    <Button size="sm" onClick={handleCheckout} disabled={checkoutLoading} className="gap-1.5">
                      {checkoutLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</> : 'Pay with Paystack'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Place order dialog */}
          {orderOpen && (
            <form onSubmit={handlePlaceOrder} className="glass rounded-2xl p-5 space-y-3 border border-primary/30">
              <h3 className="font-semibold text-sm">Place Order</h3>
              <div className="flex items-center gap-2">
                <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setOrderQty(q => Math.max(1, q - 1))}><Minus className="w-3 h-3" /></Button>
                <span className="text-sm font-medium w-6 text-center">{orderQty}</span>
                <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setOrderQty(q => Math.min(maxQty, q + 1))}><Plus className="w-3 h-3" /></Button>
              </div>
              <Input placeholder="Phone (optional)" value={orderPhone} onChange={e => setOrderPhone(e.target.value)} />
              <Textarea placeholder="Note to seller (optional)" value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOrderOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={orderLoading}>{orderLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Place Order'}</Button>
              </div>
            </form>
          )}

          {/* Message dialog */}
          {msgOpen && (
            <form onSubmit={handleSendMessage} className="glass rounded-2xl p-5 space-y-3 border border-primary/30">
              <h3 className="font-semibold text-sm">Message Seller</h3>
              <Textarea placeholder="Your message…" value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4} required />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setMsgOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={msgLoading}>{msgLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Send</>}</Button>
              </div>
            </form>
          )}

          {/* Custom request dialog */}
          {reqOpen && (
            reqSent ? (
              <div className="glass rounded-2xl p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold">Request sent!</p>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="glass rounded-2xl p-5 space-y-3 border border-primary/30">
                <h3 className="font-semibold text-sm">Custom Request</h3>
                <Input placeholder="Your name" value={reqName} onChange={e => setReqName(e.target.value)} required />
                <Input placeholder="Email" type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} required />
                <Input placeholder="Phone (optional)" value={reqPhone} onChange={e => setReqPhone(e.target.value)} />
                <Textarea placeholder="Describe what you need…" value={reqMessage} onChange={e => setReqMessage(e.target.value)} rows={3} required />
                <Input placeholder="Budget (₦, optional)" value={reqBudget} onChange={e => setReqBudget(e.target.value)} />
                <Input placeholder="Quantity (optional)" value={reqQty} onChange={e => setReqQty(e.target.value)} />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setReqOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={reqLoading}>{reqLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send Request'}</Button>
                </div>
              </form>
            )
          )}

          {/* Similar ads */}
          {similar.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3">Similar Ads</h3>
              <div className="space-y-2">
                {similar.map(s => <PostCard key={s.id} ad={s} currentUserId={currentUserId} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Missing icon import fix
function Send({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
