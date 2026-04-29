"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, getInitials } from '@/lib/utils'

interface Comment {
  id: string
  body: string
  created_at: string
  user_id: string
  profiles?: { id: string; full_name: string | null; avatar_url: string | null } | null
}

interface Props {
  adId: string
  currentUserId?: string | null
}

export default function CommentsSection({ adId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  const load = async () => {
    try {
      const res = await fetch(`/api/comments?adId=${adId}`, { cache: 'no-store' })
      const data = await res.json()
      setComments(data.comments || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [adId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    if (!currentUserId) {
      toast.error('Sign in to comment')
      return
    }
    setPosting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      setComments(c => [data.comment, ...c])
      setBody('')
      toast.success('Comment posted')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPosting(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setComments(c => c.filter(x => x.id !== id))
      toast.success('Comment deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <section id="comments" className="mt-8 bg-card border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-base">Comments {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}</h2>
      </div>

      {currentUserId ? (
        <form onSubmit={submit} className="mb-5">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your thoughts or ask a question…"
            rows={3}
            maxLength={1000}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">{body.length}/1000 — visible to everyone</span>
            <button type="submit" disabled={posting || !body.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
              {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Post</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-5 bg-muted/40 border border-border/60 rounded-xl p-3 text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link> to leave a comment.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Be the first to comment.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map(c => {
            const name = c.profiles?.full_name || 'FimiHub User'
            const isMine = c.user_id === currentUserId
            return (
              <li key={c.id} className="flex gap-3 group">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {c.profiles?.avatar_url ? (
                    <img src={c.profiles.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted/40 rounded-2xl px-3.5 py-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{name}</span>
                      <span className="text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                  {isMine && (
                    <button onClick={() => remove(c.id)} className="mt-1 ml-3 text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
