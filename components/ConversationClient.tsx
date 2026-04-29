"use client"
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DashboardNav from '@/components/DashboardNav'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Conversation, Message } from '@/lib/supabase/types'

interface Props {
  conversation: Conversation & {
    ad?: { id: string; title: string; price: number | null; price_type: string } | null
  }
  initialMessages: Message[]
  currentUserId: string
}

const kindLabel: Record<string, string> = {
  inquiry: 'Inquiry',
  request: 'Custom request',
  order: 'Order',
}

export default function ConversationClient({ conversation, initialMessages, currentUserId }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  const isSeller = conversation.seller_id === currentUserId
  const other = isSeller ? conversation.buyer : conversation.seller
  const otherName = other?.full_name || other?.email || 'User'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Live updates via Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const m = payload.new as Message
          setMessages(prev => (prev.find(x => x.id === m.id) ? prev : [...prev, m]))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversation.id])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send')
      setMessages(prev => prev.find(x => x.id === data.message.id) ? prev : [...prev, data.message])
      setBody('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <DashboardNav />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <button onClick={() => router.push('/inbox')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to inbox
        </button>

        <div className="glass rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {(otherName[0] || '?').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{otherName}</p>
                <p className="text-xs text-muted-foreground">{kindLabel[conversation.kind]} · {isSeller ? 'buyer' : 'seller'}</p>
              </div>
            </div>
            {conversation.ad && (
              <Link href={`/ad/${conversation.ad.id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0 mt-1">
                <ExternalLink className="w-3 h-3" /> View ad
              </Link>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet — say hello!</p>
            ) : messages.map(m => {
              const mine = m.sender_id === currentUserId
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-background border border-border rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Composer */}
          <form onSubmit={send} className="p-3 border-t border-border/60 flex items-end gap-2 bg-background shrink-0">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(e as any)
                }
              }}
              placeholder="Write a reply…"
              rows={1}
              className="flex-1 resize-none text-sm border border-border/70 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
            />
            <Button type="submit" disabled={sending || !body.trim()} className="gap-1.5 shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
