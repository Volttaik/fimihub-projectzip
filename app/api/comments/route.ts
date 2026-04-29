import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get('adId')
  if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, user_id, profiles:user_id (id, full_name, avatar_url)')
    .eq('ad_id', adId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 })

  const { adId, body } = await req.json().catch(() => ({}))
  if (!adId || !body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  }
  if (body.length > 1000) {
    return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ ad_id: adId, user_id: user.id, body: body.trim() })
    .select('id, body, created_at, user_id, profiles:user_id (id, full_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
