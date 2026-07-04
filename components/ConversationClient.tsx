"use client"
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DashboardNav from '@/components/DashboardNav'
import { toast } from 'sonner'
import type { Conversation, Message } from '@/lib/supabase/types'
import { timeAgo } from '@/lib/utils'

interface Props {
  conversation: Conversation & {
    ad?: { id: string; title: string; media: any[]; price: number | null; price_type: string } | null
    buyer?: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
    seller?: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  }
  initialMessages: Message[]
  currentUserId: string
}

export default function ConversationClient({ conversation: convo, initialMessages, currentUserId }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTimestampRef = useRef<string>(initialMessages[initialMessages.length - 1]?.created_at ?? new Date(0).toISOString())

  const isBuyer = convo.buyer_id === currentUserId
  const other = isBuyer ? convo.seller : convo.buyer
  const otherName = other?.full_name || other?.email || 'User'

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/conversations/${convo.id}/messages?after=${encodeURIComponent(lastTimestampRef.current)}`)
        if (!res.ok) return
        const { messages: newMsgs } = await res.json()
        if (newMsgs?.length) {
          setMessages(prev => {
            const existingIds = new Set(prev.map((m: Message) => m.id))
            const fresh = newMsgs.filter((m: Message) => !existingIds.has(m.id))
            if (!fresh.length) return prev
            lastTimestampRef.current = fresh[fresh.length - 1].created_at
            return [...prev, ...fresh]
          })
        }
      } catch {}
    }
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [convo.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${convo.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Could not send message')
      const { message } = await res.json()
      setMessages(prev => [...prev, message])
      lastTimestampRef.current = message.created_at
      setBody('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <DashboardNav />

      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/inbox')} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
          {(otherName[0] || '?').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{otherName}</p>
          {convo.ad?.title && (
            <Link href={`/ad/${convo.ad.id}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              {convo.ad.title} <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
        ) : messages.map(msg => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-border/60 bg-background/80 backdrop-blur-sm px-4 py-3 flex gap-2">
        <input
          className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          placeholder="Type a message…"
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any) } }}
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!body.trim() || sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  )
}
