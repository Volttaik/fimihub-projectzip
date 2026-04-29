import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardNav from '@/components/DashboardNav'
import { Inbox as InboxIcon, MessageSquare, Package, Send } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/inbox')

  const admin = createAdminClient()
  const { data: conversations } = await admin
    .from('conversations')
    .select(`
      id, ad_id, buyer_id, seller_id, kind, subject, last_message_at,
      ad:ads(id, title, media),
      buyer:profiles!conversations_buyer_id_fkey(id, full_name, email, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, full_name, email, avatar_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
    .limit(100)

  const list = conversations || []

  const kindBadge: Record<string, { label: string; cls: string; Icon: any }> = {
    inquiry: { label: 'Inquiry', cls: 'bg-primary/10 text-primary', Icon: MessageSquare },
    request: { label: 'Request', cls: 'bg-amber-100 text-amber-700', Icon: Send },
    order:   { label: 'Order',   cls: 'bg-emerald-100 text-emerald-700', Icon: Package },
  }

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><InboxIcon className="w-6 h-6" /> Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">Conversations with buyers and sellers — orders, requests, and inquiries.</p>
        </div>

        {list.length === 0 ? (
          <div className="glass rounded-2xl text-center py-16 px-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <InboxIcon className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="font-semibold">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">When someone contacts you about an ad, or you reach out to a seller, the chat will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((c: any) => {
              const isSeller = c.seller_id === user.id
              const other = isSeller ? c.buyer : c.seller
              const otherName = other?.full_name || other?.email || 'User'
              const meta = kindBadge[c.kind] || kindBadge.inquiry
              const Icon = meta.Icon
              return (
                <Link key={c.id} href={`/inbox/${c.id}`} className="block">
                  <div className="glass rounded-2xl p-4 hover:border-primary/40 border border-border/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                        {(otherName[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold truncate">{otherName}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(c.last_message_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold tracking-wide inline-flex items-center gap-1 ${meta.cls}`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">{isSeller ? 'incoming' : 'outgoing'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{c.subject || c.ad?.title || 'Conversation'}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
