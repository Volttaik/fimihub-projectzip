"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MapPin, Eye, Heart, Share2, Phone, Mail, ChevronLeft, ChevronRight, PlayCircle, BadgeCheck, Zap, Images, Calendar, ArrowLeft, AlertTriangle } from 'lucide-react'
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
}

export default function AdDetailClient({ ad, similar }: Props) {
  const [mediaIdx, setMediaIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const media = ad.media || []
  const currentMedia = media[mediaIdx]
  const supabase = createClient()

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sign in to save ads'); return }
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
                  <Image src={currentMedia.url} alt={ad.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 700px" />
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

            <p className="text-2xl font-black text-primary mb-4">{formatPrice(ad.price ?? null, ad.price_type)}</p>
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
                {similar.map(s => <PostCard key={s.id} ad={s} />)}
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
              {ad.contact_phone && (
                <Button onClick={() => setShowPhone(true)} variant={showPhone ? 'outline' : 'default'} className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  {showPhone ? ad.contact_phone : 'Show Phone Number'}
                </Button>
              )}
              <Button onClick={() => setShowEmail(true)} variant={showEmail ? 'outline' : 'outline'} className="w-full gap-2">
                <Mail className="w-4 h-4" />
                {showEmail ? (
                  <a href={`mailto:${ad.contact_email}`} className="text-primary hover:underline truncate">
                    {ad.contact_email}
                  </a>
                ) : 'Show Email'}
              </Button>
              {showEmail && (
                <a href={`mailto:${ad.contact_email}?subject=Re: ${encodeURIComponent(ad.title)}`}>
                  <Button className="w-full gap-2">
                    <Mail className="w-4 h-4" /> Send Email
                  </Button>
                </a>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-border text-xs text-muted-foreground space-y-1">
              <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" /> Always meet in a safe, public place</p>
              <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" /> Never send money in advance</p>
              <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" /> FimiHub does not facilitate payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
