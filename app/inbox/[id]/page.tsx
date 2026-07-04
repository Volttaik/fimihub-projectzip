import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import ConversationClient from '@/components/ConversationClient'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect(`/login?redirect=/inbox/${id}`)

  const { rows: convoRows } = await pool.query(`
    SELECT
      c.*,
      json_build_object('id', a.id, 'title', a.title, 'media', a.media, 'price', a.price, 'price_type', a.price_type) AS ad,
      json_build_object('id', b.id, 'full_name', b.full_name, 'email', b.email, 'avatar_url', b.avatar_url) AS buyer,
      json_build_object('id', s.id, 'full_name', s.full_name, 'email', s.email, 'avatar_url', s.avatar_url) AS seller
    FROM conversations c
    LEFT JOIN ads a ON a.id = c.ad_id
    LEFT JOIN profiles b ON b.id = c.buyer_id
    LEFT JOIN profiles s ON s.id = c.seller_id
    WHERE c.id = $1
    LIMIT 1
  `, [id])

  if (!convoRows.length) notFound()
  const convo = convoRows[0]
  if (convo.buyer_id !== user.id && convo.seller_id !== user.id) notFound()

  const { rows: messages } = await pool.query(`
    SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC
  `, [id])

  // Mark messages as read
  await pool.query(`
    UPDATE messages SET read_at = NOW()
    WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
  `, [id, user.id])

  return (
    <ConversationClient
      conversation={convo as any}
      initialMessages={messages}
      currentUserId={user.id}
    />
  )
}
