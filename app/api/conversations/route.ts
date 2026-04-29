import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Start (or reuse) a generic inquiry conversation about an ad
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be logged in to message a seller' }, { status: 401 })

  const { ad_id, body } = await req.json()
  if (!ad_id || !body?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  const { data: ad } = await admin
    .from('ads')
    .select('id, title, user_id')
    .eq('id', ad_id)
    .single()
  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  if (ad.user_id === user.id) return NextResponse.json({ error: "You can't message yourself" }, { status: 400 })

  // Reuse existing inquiry thread for this (ad, buyer) pair
  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('ad_id', ad_id)
    .eq('buyer_id', user.id)
    .eq('kind', 'inquiry')
    .maybeSingle()

  let conversationId = existing?.id
  if (!conversationId) {
    const { data: convo, error } = await admin
      .from('conversations')
      .insert({
        ad_id: ad.id,
        buyer_id: user.id,
        seller_id: ad.user_id,
        kind: 'inquiry',
        subject: ad.title,
      } as any)
      .select('id')
      .single()
    if (error || !convo) return NextResponse.json({ error: 'Could not start conversation' }, { status: 500 })
    conversationId = convo.id
  }

  await admin.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: body.trim(),
  } as any)

  return NextResponse.json({ ok: true, conversation_id: conversationId })
}
