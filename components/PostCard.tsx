"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, Eye, Heart, MessageCircle, Share2, Star, ShoppingBag, Wrench, Home, Briefcase, BadgeCheck, PlayCircle, Images, X, Send, ShoppingCart } from 'lucide-react'
import type { Ad } from '@/lib/supabase/types'
import { formatPrice, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }> = {
  products: { label: 'Products', icon: ShoppingBag, badgeClass: 'bg-primary/10 text-primary' },
  services: { label: 'Services', icon: Wrench, badgeClass: 'bg-primary/10 text-primary' },
  rentals:  { label: 'Rentals', icon: Home, badgeClass: 'bg-primary/10 text-primary' },
  business: { label: 'Business', icon: Briefcase, badgeClass: 'bg-accent/15 text-accent-foreground' },
}

const avatarPalette = [
  'hsl(263,78%,56%)', 'hsl(35,90%,52%)', 'hsl(155,55%,42%)',
  'hsl(217,85%,53%)', 'hsl(340,70%,52%)', 'hsl(199,80%,46%)',
]
function getAvatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return avatarPalette[Math.abs(h) % avatarPalette.length]
}

interface Props {
  ad: Ad
  savedByUser?: boolean
  currentUserId?: string | null
  priority?: boolean
}

export default function PostCard({ ad, savedByUser = false, currentUserId = null, priority = false }: Props) {
  const [saved, setSaved] = useState(savedByUser)
  const [savingLoading, setSavingLoading] = useState(false)
  const [cmtOpen, setCmtOpen] = useState(false)
  const [cmtBody, setCmtBody] = useState('')
  const [cmtLoading, setCmtLoading] = useState(false)
  const router = useRouter()
  const cat = categoryConfig[ad.category] ?? categoryConfig.products
  const Icon = cat.icon
  const avatarColor = getAvatarColor(ad.profiles?.full_name || ad.user_id)
  const posterName = ad.profiles?.full_name || 'fimihub User'
  const media = ad.media || []
  const firstMedia = media[0]
  const isVideo = firstMedia?.type === 'video'
  const isAlbum = media.length > 1
  const isOwner = !!currentUserId && currentUserId === ad.user_id
  const canBuy = !!ad.accept_payments && !!ad.price && !isOwner
  const supabase = createClient()

  const openComment = async () => {
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Sign in to leave a comment')
        router.push(`/login?redirect=/ad/${ad.id}`)
        return
      }
    }
    setCmtOpen(true)
  }

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cmtBody.trim()) return
    setCmtLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id, body: cmtBody.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not post comment')
      toast.success('Comment posted')
      setCmtBody('')
      setCmtOpen(false)
      router.push(`/ad/${ad.id}#comments`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCmtLoading(false)
    }
  }

  const handleSave = async () => {
    setSavingLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sign in to save ads'); setSavingLoading(false); return }
    if (saved) {
      await supabase.from('saves').delete().eq('user_id', user.id).eq('ad_id', ad.id)
      setSaved(false)
      toast.success('Removed from saved')
    } else {
      await supabase.from('saves').insert({ user_id: user.id, ad_id: ad.id })
      setSaved(true)
      toast.success('Ad saved!')
    }
    setSavingLoading(false)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/ad/${ad.id}`)
    toast.success('Link copied to clipboard!')
  }

  return (
    <article className="glass rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group/card animate-in-up">
      {ad.featured && (
        <div className="flex items-center gap-1.5 px-4 pt-3">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="text-xs font-semibold text-accent tracking-wide uppercase">Sponsored</span>
        </div>
      )}

      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
              style={{ backgroundColor: avatarColor }}>
              {posterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{posterName}</span>
                {ad.profiles?.email_verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-primary" aria-label="Verified seller" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[160px]">{ad.location}</span>
                <span className="text-border">·</span>
                <span className="shrink-0">{timeAgo(ad.created_at)}</span>
              </div>
            </div>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cat.badgeClass}`}>
            <Icon className="w-3 h-3" />
            {cat.label}
          </span>
        </div>

        <Link href={`/ad/${ad.id}`} className="block">
          <h3 className="font-bold text-[15px] leading-snug mb-1.5 group-hover/card:text-primary transition-colors duration-200">
            {ad.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {ad.description}
          </p>

          {firstMedia && (
            <div className="rounded-xl overflow-hidden mb-3 bg-muted aspect-video relative">
              {isVideo ? (
                <>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <PlayCircle className="w-12 h-12 text-white/90" />
                  </div>
                  <video src={firstMedia.url} className="w-full h-full object-cover" muted />
                </>
              ) : (
                <Image src={firstMedia.url} alt={ad.title} fill priority={priority} className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]" sizes="(max-width: 768px) 100vw, 600px" />
              )}
              {isAlbum && (
                <div className="absolute bottom-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Images className="w-3 h-3" /> {media.length}
                </div>
              )}
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-base font-bold text-primary">{formatPrice(ad.price ?? null, ad.price_type)}</span>
          {ad.price_type === 'negotiable' && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Negotiable</span>
          )}
          {(ad.tags || []).slice(0, 2).map(tag => (
            <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`}>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors">#{tag}</span>
            </Link>
          ))}
        </div>
      </div>

      {canBuy && (
        <div className="px-4 pb-3">
          <Link href={`/ad/${ad.id}#buy`}>
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-3 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">
              <ShoppingCart className="w-4 h-4" /> Buy now
            </button>
          </Link>
        </div>
      )}

      <div className="flex items-center border-t border-border/60 px-1">
        <button onClick={openComment}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-2.5 rounded-xl hover:bg-primary/8 flex-1 justify-center">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Comment</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-2.5 flex-1 justify-center">
          <Eye className="w-4 h-4" />
          <span>{(ad.views || 0).toLocaleString()}</span>
        </div>
        <button onClick={handleSave} disabled={savingLoading}
          className={`flex items-center gap-1.5 text-xs transition-all duration-200 px-3 py-2.5 rounded-xl flex-1 justify-center ${saved ? 'text-rose-500 bg-rose-50' : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-50/60'}`}>
          <Heart className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-rose-500 scale-110' : ''}`} />
          <span className="hidden sm:inline font-medium">Save</span>
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-2.5 rounded-xl hover:bg-primary/8 flex-1 justify-center">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Share</span>
        </button>
      </div>

      {cmtOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" onClick={() => !cmtLoading && setCmtOpen(false)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-5 animate-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-base">Leave a comment</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">On: {ad.title}</p>
              </div>
              <button onClick={() => setCmtOpen(false)} disabled={cmtLoading}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={sendComment} className="flex flex-col gap-3">
              <textarea
                value={cmtBody}
                onChange={e => setCmtBody(e.target.value)}
                placeholder="Share your thoughts or ask a question…"
                rows={4}
                maxLength={1000}
                autoFocus
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                required
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{cmtBody.length}/1000 — visible to everyone</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCmtOpen(false)} disabled={cmtLoading}
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-border hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={cmtLoading || !cmtBody.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                  {cmtLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Post</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  )
}
