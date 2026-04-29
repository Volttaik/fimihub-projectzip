"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Coins, Zap, CheckCircle2, Loader2, TrendingUp, Star } from 'lucide-react'
import type { CreditTransaction } from '@/lib/supabase/types'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

const CREDIT_PACKS = [
  { credits: 10, price: 2000, label: 'Starter', description: 'Boost 2 ads for 7 days each', highlight: false },
  { credits: 25, price: 4500, label: 'Growth', description: 'Boost 5 ads + priority placement', highlight: true },
  { credits: 60, price: 9000, label: 'Pro', description: 'Boost 12 ads + featured badge', highlight: false },
]

interface Props {
  userId: string
  userEmail: string
  credits: number
  transactions: CreditTransaction[]
}

export default function CreditsClient({ userId, userEmail, credits: initialCredits, transactions }: Props) {
  const [credits, setCredits] = useState(initialCredits)
  const [loading, setLoading] = useState<number | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('Payment successful! Credits have been added to your account.')
    }
  }, [])

  const handleBuyCredits = async (pack: typeof CREDIT_PACKS[0]) => {
    setLoading(pack.credits)
    try {
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!paystackKey) {
        toast.error('Payment is not configured yet. Please contact support.')
        setLoading(null)
        return
      }

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pack.price,
          credits: pack.credits,
          userId,
          email: userEmail,
        }),
      })
      const data = await res.json()
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        toast.error(data.error || 'Payment initialization failed')
      }
    } catch {
      toast.error('Payment service unavailable')
    }
    setLoading(null)
  }

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Buy Credits</h1>
        <p className="text-muted-foreground text-sm mt-1">Use credits to boost your ad spaces to the top of search results.</p>
      </div>

      {/* Current balance */}
      <div className="glass rounded-2xl p-6 mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
          <Coins className="w-8 h-8 text-accent" />
        </div>
        <div>
          <p className="text-3xl font-bold">{credits}</p>
          <p className="text-muted-foreground text-sm">Available credits</p>
        </div>
        <div className="ml-auto text-right text-sm text-muted-foreground">
          <p>1 credit = boost 1 ad for 1 day</p>
          <p>5 credits = boost 1 ad for 7 days</p>
        </div>
      </div>

      {/* Credit packs */}
      <h2 className="text-lg font-semibold mb-4">Choose a credit pack</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {CREDIT_PACKS.map(pack => (
          <div key={pack.credits} className={`glass rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 relative ${pack.highlight ? 'ring-2 ring-primary shadow-lg' : ''}`}>
            {pack.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Most Popular
                </span>
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{pack.label}</p>
              <p className="text-3xl font-black mt-1">{pack.credits} <span className="text-base font-semibold text-muted-foreground">credits</span></p>
              <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold">₦{pack.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">₦{(pack.price / pack.credits).toFixed(0)}/credit</p>
            </div>
            <Button onClick={() => handleBuyCredits(pack)} disabled={loading !== null} className="w-full gap-2">
              {loading === pack.credits ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><Zap className="w-4 h-4" /> Buy {pack.credits} Credits</>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* How credits work */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h3 className="font-semibold mb-4">How credits work</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Coins, title: 'Buy credits', desc: 'Purchase a credit pack using Paystack — pay with card or bank transfer.' },
            { icon: Zap, title: 'Boost your ads', desc: 'Use 5 credits to boost any ad space to the top of search results for 7 days.' },
            { icon: TrendingUp, title: 'Get more views', desc: 'Boosted ads appear first, get a "Sponsored" badge, and reach more buyers.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Transaction History</h3>
          </div>
          <div className="divide-y divide-border">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'purchase' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {tx.type === 'purchase' ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-bold ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.type === 'purchase' ? '+' : '-'}{Math.abs(tx.amount)} credits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
