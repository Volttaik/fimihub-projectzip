"use client"
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Heart, TrendingUp, Clock, CheckCircle2, XCircle, BarChart2, Coins, Trash2, Zap, Edit2 } from 'lucide-react'
import DashboardNav from '@/components/DashboardNav'
import AvatarUploader from '@/components/AvatarUploader'
import { Skeleton } from '@/components/ui/skeleton'
import type { Ad, Profile, CreditTransaction, AppUser } from '@/lib/supabase/types'
import { formatPrice, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active:  { label: 'Active',   className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: 'Pending',  className: 'bg-yellow-100 text-yellow-700',   icon: <Clock className="w-3 h-3" /> },
  sold:    { label: 'Sold',     className: 'bg-muted text-muted-foreground',   icon: <XCircle className="w-3 h-3" /> },
  expired: { label: 'Expired',  className: 'bg-red-100 text-red-700',         icon: <XCircle className="w-3 h-3" /> },
  rejected:{ label: 'Rejected', className: 'bg-red-100 text-red-700',         icon: <XCircle className="w-3 h-3" /> },
}

interface Props {
  user: AppUser
  profile: Profile | null
  ads: Ad[]
  transactions: CreditTransaction[]
  freeBoostAvailable: boolean
}

export default function DashboardClient({ user, profile, ads, transactions, freeBoostAvailable: initFreeBoost }: Props) {
  const [adList, setAdList] = useState(ads)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [freeBoostAvailable, setFreeBoostAvailable] = useState(initFreeBoost)

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const credits = profile?.credits || 0
  const totalViews = adList.reduce((acc, ad) => acc + (ad.views || 0), 0)
  const activeAds = adList.filter(a => a.status === 'active').length

  const stats = [
    { label: 'My Ad Spaces',  value: adList.length.toString(),       icon: BarChart2,  change: `${activeAds} active` },
    { label: 'Total Views',   value: totalViews.toLocaleString(),     icon: Eye,        change: 'All time' },
    { label: 'Credits',       value: credits.toString(),              icon: Coins,      change: 'Available to spend' },
    { label: 'Transactions',  value: transactions.length.toString(),  icon: TrendingUp, change: 'All time' },
  ]

  const handleDelete = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad space?')) return
    setDeletingId(adId)
    try {
      const res = await fetch(`/api/ads/${adId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed')
      setAdList(prev => prev.filter(a => a.id !== adId))
      toast.success('Ad space deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete ad')
    } finally {
      setDeletingId(null)
    }
  }

  const handleBoost = async (adId: string) => {
    if (!freeBoostAvailable && credits < 5) {
      toast.error('You need at least 5 credits to boost an ad')
      return
    }
    try {
      const res = await fetch(`/api/ads/${adId}/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFree: freeBoostAvailable }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Boost failed')
      const { expiresAt } = await res.json()
      setAdList(prev => prev.map(a => a.id === adId ? { ...a, is_boosted: true, boost_expires_at: expiresAt } : a))
      if (freeBoostAvailable) setFreeBoostAvailable(false)
      toast.success(`Ad boosted for 7 days${freeBoostAvailable ? ' (free!)' : ' (-5 credits)'}`)
    } catch (err: any) {
      toast.error(err.message || 'Boost failed')
    }
  }

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="glass rounded-2xl p-5 mb-6 flex items-center gap-4">
          <AvatarUploader userId={user.id} initialUrl={profile?.avatar_url ?? null} displayName={displayName} size={56} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{displayName}</h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.change}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ads */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Your Ad Spaces</h2>
              <Link href="/post"><Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Post Ad</Button></Link>
            </div>
            {adList.length === 0 ? (
              <div className="glass rounded-2xl text-center py-12">
                <p className="text-muted-foreground text-sm">No ads yet. Post your first ad space!</p>
                <Link href="/post"><Button size="sm" className="mt-3">Post now</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {adList.map(ad => {
                  const sc = statusConfig[ad.status] || statusConfig.active
                  return (
                    <div key={ad.id} className="glass rounded-xl p-4 border border-border/40">
                      <div className="flex items-start gap-3">
                        {ad.media?.[0]?.url && (
                          <img src={ad.media[0].url} alt={ad.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium truncate">{ad.title}</p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.className}`}>
                              {sc.icon} {sc.label}
                            </span>
                            {ad.is_boosted && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">⚡ Boosted</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{ad.views} views · {timeAgo(ad.created_at)}</p>
                          {ad.price && <p className="text-sm font-semibold mt-1">{formatPrice(ad.price, ad.price_type)}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Link href={`/ad/${ad.id}`}><Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Eye className="w-3 h-3" /> View</Button></Link>
                        <Link href={`/ad/${ad.id}/edit`}><Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Edit2 className="w-3 h-3" /> Edit</Button></Link>
                        {!ad.is_boosted && (
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleBoost(ad.id)}>
                            <Zap className="w-3 h-3" /> {freeBoostAvailable ? 'Free Boost' : 'Boost (5cr)'}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => handleDelete(ad.id)} disabled={deletingId === ad.id}>
                          <Trash2 className="w-3 h-3" /> {deletingId === ad.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Credits */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border/60">
                <h3 className="font-semibold text-sm mb-3">Credits</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{credits}</p>
                    <p className="text-xs text-muted-foreground">Available credits</p>
                  </div>
                </div>
                <Link href="/credits"><Button size="sm" className="w-full gap-1.5 mt-3" variant="outline"><Plus className="w-3.5 h-3.5" /> Buy More Credits</Button></Link>
              </div>
              {transactions.length > 0 && (
                <div className="divide-y divide-border max-h-48 overflow-y-auto">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${tx.type === 'purchase' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type === 'purchase' ? '+' : '-'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(tx.created_at)}</p>
                      </div>
                      <span className={`text-xs font-bold ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'purchase' ? '+' : '-'}{Math.abs(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Link href="/post"><Button variant="outline" size="sm" className="w-full justify-start gap-2"><Plus className="w-3.5 h-3.5" /> Post a New Ad Space</Button></Link>
                <Link href="/"><Button variant="outline" size="sm" className="w-full justify-start gap-2"><Eye className="w-3.5 h-3.5" /> Browse Marketplace</Button></Link>
                <Link href="/credits"><Button variant="outline" size="sm" className="w-full justify-start gap-2"><Coins className="w-3.5 h-3.5" /> Buy Credits</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
