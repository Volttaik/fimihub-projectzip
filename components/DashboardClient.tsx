"use client"
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Heart, MessageSquare, TrendingUp, Clock, CheckCircle2, XCircle, BarChart2, Coins, Trash2, Zap, Edit2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Ad, Profile, CreditTransaction } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'
import { formatPrice, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active:  { label: 'Active',  className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700',   icon: <Clock className="w-3 h-3" /> },
  sold:    { label: 'Sold',    className: 'bg-muted text-muted-foreground',   icon: <XCircle className="w-3 h-3" /> },
  expired: { label: 'Expired', className: 'bg-red-100 text-red-700',         icon: <XCircle className="w-3 h-3" /> },
  rejected:{ label: 'Rejected',className: 'bg-red-100 text-red-700',         icon: <XCircle className="w-3 h-3" /> },
}

interface Props {
  user: User
  profile: Profile | null
  ads: Ad[]
  transactions: CreditTransaction[]
}

export default function DashboardClient({ user, profile, ads, transactions }: Props) {
  const [adList, setAdList] = useState(ads)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const credits = profile?.credits || 0
  const totalViews = adList.reduce((acc, ad) => acc + (ad.views || 0), 0)
  const activeAds = adList.filter(a => a.status === 'active').length

  const stats = [
    { label: 'My Ad Spaces',   value: adList.length.toString(),        icon: BarChart2,     change: `${activeAds} active` },
    { label: 'Total Views',    value: totalViews.toLocaleString(),      icon: Eye,           change: 'All time' },
    { label: 'Credits',        value: credits.toString(),               icon: Coins,         change: 'Available to spend' },
    { label: 'Transactions',   value: transactions.length.toString(),   icon: TrendingUp,    change: 'All time' },
  ]

  const handleDelete = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad space?')) return
    setDeletingId(adId)
    const { error } = await supabase.from('ads').delete().eq('id', adId)
    if (error) {
      toast.error('Failed to delete ad')
    } else {
      setAdList(prev => prev.filter(a => a.id !== adId))
      toast.success('Ad space deleted')
    }
    setDeletingId(null)
  }

  const handleBoost = async (adId: string) => {
    if (credits < 5) { toast.error('You need at least 5 credits to boost an ad'); return }
    const { error } = await supabase.rpc('boost_ad', { ad_id: adId })
    if (error) toast.error('Boost failed. Please try again.')
    else toast.success('Ad boosted for 7 days')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {displayName.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your ad spaces.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/credits">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span className="font-bold text-accent">{credits} credits</span>
            </Button>
          </Link>
          <Link href="/post">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> New Ad Space
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Ad Spaces */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">My Ad Spaces</h2>
              <Link href="/post" className="text-xs text-primary hover:underline">+ New ad space</Link>
            </div>
            {adList.length === 0 ? (
              <div className="text-center py-12">
                <BarChart2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium">No ad spaces yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Post your first ad space to get started</p>
                <Link href="/post">
                  <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Post an Ad Space</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {adList.map(ad => {
                  const s = statusConfig[ad.status] || statusConfig.active
                  return (
                    <div key={ad.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ad.title}</p>
                        <p className="text-xs text-muted-foreground">{ad.category} · {timeAgo(ad.created_at)}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary shrink-0">{formatPrice(ad.price ?? null, ad.price_type)}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Eye className="w-3 h-3" /> {ad.views || 0}
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${s.className}`}>
                        {s.icon} {s.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/ad/${ad.id}`}>
                          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button onClick={() => handleBoost(ad.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" title="Boost (5 credits)">
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(ad.id)} disabled={deletingId === ad.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Credits & transactions */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Credits</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{credits}</p>
                  <p className="text-xs text-muted-foreground">Available credits</p>
                </div>
              </div>
              <Link href="/credits">
                <Button size="sm" className="w-full gap-1.5" variant="outline">
                  <Plus className="w-3.5 h-3.5" /> Buy More Credits
                </Button>
              </Link>
            </div>
            {transactions.length > 0 && (
              <div className="border-t border-border divide-y divide-border max-h-48 overflow-y-auto">
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
              <Link href="/post">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2"><Plus className="w-3.5 h-3.5" /> Post a New Ad Space</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2"><Eye className="w-3.5 h-3.5" /> Browse Marketplace</Button>
              </Link>
              <Link href="/credits">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2"><Coins className="w-3.5 h-3.5" /> Buy Credits</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
