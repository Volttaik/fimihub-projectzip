"use client"
import { useState } from 'react'
import DashboardNav from '@/components/DashboardNav'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import type { CustomRequest } from '@/lib/supabase/types'

interface Props {
  requests: (CustomRequest & { ad?: { id: string; title: string } | null })[]
}

const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
  open:      { label: 'Open',      cls: 'bg-blue-100 text-blue-700',    icon: Clock },
  responded: { label: 'Responded', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  closed:    { label: 'Closed',    cls: 'bg-muted text-muted-foreground', icon: XCircle },
}

export default function RequestsClient({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests)

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/custom-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r))
      toast.success('Status updated')
    } catch (err: any) {
      toast.error(err.message || 'Could not update status')
    }
  }

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Custom Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Buyers who sent custom requests for your ads.</p>
        </div>

        {requests.length === 0 ? (
          <div className="glass rounded-2xl text-center py-16 px-4">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold">No requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">Custom requests from buyers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => {
              const sc = statusConfig[r.status] || statusConfig.open
              const Icon = sc.icon
              return (
                <div key={r.id} className="glass rounded-2xl p-5 border border-border/40">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold">{r.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">{r.buyer_email}{r.buyer_phone ? ` · ${r.buyer_phone}` : ''}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.cls}`}>
                      <Icon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  {r.ad && <p className="text-xs text-muted-foreground mb-2">Re: <span className="font-medium">{r.ad.title}</span></p>}
                  <p className="text-sm mb-3 whitespace-pre-wrap">{r.message}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                    {r.budget && <span>Budget: ₦{Number(r.budget).toLocaleString()}</span>}
                    {r.quantity && <span>Qty: {r.quantity}</span>}
                    <span>{timeAgo(r.created_at)}</span>
                  </div>
                  {r.status === 'open' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateStatus(r.id, 'responded')}>Mark Responded</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'closed')}>Close</Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
