"use client"
import Link from 'next/link'
import { Wallet, TrendingUp, ShoppingBag, Landmark, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile, Order } from '@/lib/supabase/types'
import DashboardNav from '@/components/DashboardNav'
import { timeAgo } from '@/lib/utils'

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

export default function RevenueClient({ profile, orders }: { profile: Profile | null; orders: Order[] }) {
  const paid = orders.filter(o => o.status === 'paid')
  const totalRevenue = paid.reduce((s, o) => s + (o.seller_amount_kobo || 0), 0)
  const totalGross = paid.reduce((s, o) => s + (o.amount_kobo || 0), 0)
  const totalFees = paid.reduce((s, o) => s + (o.platform_fee_kobo || 0), 0)
  const totalUnits = paid.reduce((s, o) => s + (o.quantity || 0), 0)
  const pending = orders.filter(o => o.status === 'pending').length

  const stats = [
    { label: 'Net revenue',  value: naira(totalRevenue), icon: Wallet,      sub: 'Settled to your bank' },
    { label: 'Gross sales',  value: naira(totalGross),   icon: TrendingUp,  sub: `${paid.length} orders` },
    { label: 'Items sold',   value: totalUnits.toString(), icon: ShoppingBag, sub: 'Across all ad spaces' },
    { label: 'Platform fees',value: naira(totalFees),    icon: Landmark,    sub: '5% per sale' },
  ]

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Revenue</h1>
            <p className="text-sm text-muted-foreground mt-1">Track every sale and payout from your ad spaces.</p>
          </div>
          <Link href="/bank-account"><Button variant="outline" size="sm" className="gap-1.5"><Landmark className="w-4 h-4" /> Payout settings</Button></Link>
        </div>

        {!profile?.paystack_subaccount_code && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900">Connect a bank account</p>
              <p className="text-amber-800/80 mt-0.5">Add your bank details so buyers can pay you directly through your ad spaces.</p>
            </div>
            <Link href="/bank-account"><Button size="sm">Connect</Button></Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="glass rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <p className="text-xl md:text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="font-semibold">Orders</h2>
            {pending > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{pending} pending</span>}
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="font-medium">No sales yet</p>
              <p className="text-sm text-muted-foreground mt-1">When buyers pay for your ad spaces, their orders will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {orders.map(o => (
                <Link href={`/orders/${o.paystack_reference}`} key={o.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{o.ad_title || 'Ad space'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.buyer_name || o.buyer_email} &middot; {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{naira(o.seller_amount_kobo)}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                      o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{o.status}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
