"use client"
import { useState } from 'react'
import Link from 'next/link'
import { Inbox, Mail, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DashboardNav from '@/components/DashboardNav'
import { timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { CustomRequest } from '@/lib/supabase/types'

type RequestRow = CustomRequest & { ad?: { id: string; title: string } | null }

export default function RequestsClient({ requests }: { requests: RequestRow[] }) {
  const [items, setItems] = useState(requests)
  const supabase = createClient()

  const setStatus = async (id: string, status: 'open' | 'responded' | 'closed') => {
    const prev = items
    setItems(items.map(r => r.id === id ? { ...r, status } : r))
    const { error } = await supabase.from('custom_requests').update({ status }).eq('id', id)
    if (error) { setItems(prev); toast.error('Could not update'); return }
    toast.success(`Marked as ${status}`)
  }

  const open = items.filter(r => r.status === 'open')
  const others = items.filter(r => r.status !== 'open')

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Inbox className="w-6 h-6" /> Custom requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Buyers asking for variants, bulk orders, or anything custom on your ad spaces.</p>
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl text-center py-16 px-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="font-semibold">No requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">When buyers send custom requests on your ad spaces, they appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {open.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Open ({open.length})</h2>
                <div className="space-y-3">{open.map(r => <RequestCard key={r.id} req={r} onStatus={setStatus} />)}</div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Archive</h2>
                <div className="space-y-3">{others.map(r => <RequestCard key={r.id} req={r} onStatus={setStatus} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RequestCard({ req, onStatus }: { req: RequestRow; onStatus: (id: string, s: 'open' | 'responded' | 'closed') => void }) {
  const naira = (n: number) => `₦${Number(n).toLocaleString()}`
  const statusColor =
    req.status === 'open' ? 'bg-amber-100 text-amber-700' :
    req.status === 'responded' ? 'bg-blue-100 text-blue-700' :
    'bg-muted text-muted-foreground'

  return (
    <div className="glass rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{req.buyer_name}</p>
          {req.ad && (
            <Link href={`/ad/${req.ad.id}`} className="text-xs text-primary hover:underline">
              {req.ad.title}
            </Link>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold tracking-wide ${statusColor}`}>
          {req.status}
        </span>
      </div>

      <p className="text-sm text-foreground whitespace-pre-wrap mb-4 bg-muted/40 rounded-xl p-3">{req.message}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-4">
        {req.quantity && <span>Qty: <strong className="text-foreground">{req.quantity}</strong></span>}
        {req.budget && <span>Budget: <strong className="text-foreground">{naira(req.budget)}</strong></span>}
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {timeAgo(req.created_at)}</span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <a href={`mailto:${req.buyer_email}?subject=Re: your request`} className="inline-flex">
          <Button size="sm" className="gap-1.5"><Mail className="w-3.5 h-3.5" /> Reply by email</Button>
        </a>
        {req.buyer_phone && (
          <a href={`tel:${req.buyer_phone}`} className="inline-flex">
            <Button size="sm" variant="outline" className="gap-1.5"><Phone className="w-3.5 h-3.5" /> {req.buyer_phone}</Button>
          </a>
        )}
        {req.status !== 'responded' && (
          <Button size="sm" variant="ghost" onClick={() => onStatus(req.id, 'responded')}>Mark as responded</Button>
        )}
        {req.status !== 'closed' && (
          <Button size="sm" variant="ghost" onClick={() => onStatus(req.id, 'closed')}>Close</Button>
        )}
        {req.status === 'closed' && (
          <Button size="sm" variant="ghost" onClick={() => onStatus(req.id, 'open')}>Reopen</Button>
        )}
      </div>
    </div>
  )
}
