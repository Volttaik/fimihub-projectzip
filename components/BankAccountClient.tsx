"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Landmark, CheckCircle2, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase/types'
import DashboardNav from '@/components/DashboardNav'

interface Bank { name: string; code: string; slug: string }

export default function BankAccountClient({ profile }: { profile: Profile | null }) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankCode, setBankCode] = useState('')
  const [bankQuery, setBankQuery] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [businessName, setBusinessName] = useState(profile?.full_name || '')
  const [resolving, setResolving] = useState(false)
  const [resolvedName, setResolvedName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(!profile?.paystack_subaccount_code)

  useEffect(() => {
    fetch('/api/banks').then(r => r.json()).then(d => {
      if (d?.banks) setBanks(d.banks)
    }).catch(() => {})
  }, [])

  const filteredBanks = bankQuery
    ? banks.filter(b => b.name.toLowerCase().includes(bankQuery.toLowerCase())).slice(0, 8)
    : []

  const verifyAccount = async () => {
    if (!bankCode || accountNumber.length < 10) return
    setResolving(true)
    setResolvedName(null)
    try {
      const res = await fetch('/api/account/connect-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
          business_name: businessName || 'fimihub Seller',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResolvedName(data.account_name)
      toast.success('Bank account connected')
      setTimeout(() => window.location.reload(), 800)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Landmark className="w-6 h-6" /> Payout account</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect your bank account to receive payments from buyers directly.</p>
        </div>

        {profile?.paystack_subaccount_code && !showForm ? (
          <div className="glass rounded-2xl p-6 shadow-sm border border-emerald-200/40 bg-emerald-50/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Account connected</p>
                <p className="text-sm text-muted-foreground">You can now accept payments on your ad spaces.</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Bank</p>
                    <p className="font-medium">{profile.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Account number</p>
                    <p className="font-medium">{profile.account_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Account name</p>
                    <p className="font-medium">{profile.account_name}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-5" onClick={() => setShowForm(true)}>
                  Update bank details
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <Label htmlFor="business">Business or display name *</Label>
              <Input id="business" value={businessName} onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Tunde's Electronics" className="mt-1.5" />
            </div>

            <div className="relative">
              <Label>Bank *</Label>
              <div className="relative mt-1.5">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={bankCode ? banks.find(b => b.code === bankCode)?.name || bankQuery : bankQuery}
                  onChange={e => { setBankQuery(e.target.value); setBankCode(''); setResolvedName(null) }}
                  placeholder="Search your bank…" className="pl-9" />
              </div>
              {filteredBanks.length > 0 && !bankCode && (
                <div className="absolute z-20 mt-1 w-full bg-background border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {filteredBanks.map(b => (
                    <button key={b.code} type="button"
                      onClick={() => { setBankCode(b.code); setBankQuery(b.name) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors">
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="acc">Account number *</Label>
              <Input id="acc" inputMode="numeric" maxLength={10}
                value={accountNumber}
                onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, '')); setResolvedName(null) }}
                placeholder="10-digit NUBAN" className="mt-1.5" />
            </div>

            {resolvedName && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                {resolvedName}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={verifyAccount}
                disabled={resolving || !bankCode || accountNumber.length < 10 || !businessName}
                className="flex-1">
                {resolving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Connecting…</> : 'Connect bank account'}
              </Button>
              {profile?.paystack_subaccount_code && (
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              We use Paystack to verify and settle your payouts. A 5% platform fee applies to each sale.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
