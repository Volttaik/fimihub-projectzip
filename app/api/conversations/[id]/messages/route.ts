import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params
  const user = await getUserFromRequest(req as any)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  try {
    const { rows: convoRows } = await pool.query(
      `SELECT id, buyer_id, seller_id FROM conversations WHERE id = $1 LIMIT 1`,
      [conversationId]
    )
    if (!convoRows.length) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    const convo = convoRows[0]
    if (convo.buyer_id !== user.id && convo.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *`,
      [conversationId, user.id, body.trim()]
    )
    await pool.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversationId]
    )

    return NextResponse.json({ ok: true, message: rows[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/** GET — poll for messages newer than a given timestamp */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params
  const user = await getUserFromRequest(req as any)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const url = new URL(req.url)
  const after = url.searchParams.get('after') // ISO timestamp

  try {
    const { rows: convoRows } = await pool.query(
      `SELECT buyer_id, seller_id FROM conversations WHERE id = $1 LIMIT 1`,
      [conversationId]
    )
    if (!convoRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const convo = convoRows[0]
    if (convo.buyer_id !== user.id && convo.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { rows } = after
      ? await pool.query(
          `SELECT * FROM messages WHERE conversation_id = $1 AND created_at > $2 ORDER BY created_at ASC`,
          [conversationId, after]
        )
      : await pool.query(
          `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
          [conversationId]
        )

    return NextResponse.json({ messages: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
