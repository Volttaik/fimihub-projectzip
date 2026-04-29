import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConversationClient from '@/components/ConversationClient'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/inbox/${id}`)

  const admin = createAdminClient()
  const { data: convo } = await admin
    .from('conversations')
    .select(`
      *,
      ad:ads(id, title, media, price, price_type),
      buyer:profiles!conversations_buyer_id_fkey(id, full_name, email, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!convo) notFound()
  if (convo.buyer_id !== user.id && convo.seller_id !== user.id) notFound()

  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  // Mark unread messages as read for the current user
  await admin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return (
    <ConversationClient
      conversation={convo as any}
      initialMessages={messages || []}
      currentUserId={user.id}
    />
  )
}
