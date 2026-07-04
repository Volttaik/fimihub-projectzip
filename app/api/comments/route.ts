import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get('adId')
  if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 })

  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.body, c.created_at, c.user_id,
        json_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url) AS profiles
      FROM comments c
      LEFT JOIN profiles p ON p.id = c.user_id
      WHERE c.ad_id = $1
      ORDER BY c.created_at DESC
      LIMIT 200
    `, [adId])
    return NextResponse.json({ comments: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 })

  const { adId, body } = await req.json().catch(() => ({}))
  if (!adId || !body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  }
  if (body.length > 1000) {
    return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 })
  }

  try {
    const { rows } = await pool.query(`
      WITH inserted AS (
        INSERT INTO comments (ad_id, user_id, body) VALUES ($1, $2, $3) RETURNING *
      )
      SELECT i.*,
        json_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url) AS profiles
      FROM inserted i
      LEFT JOIN profiles p ON p.id = i.user_id
    `, [adId, user.id, body.trim()])
    return NextResponse.json({ comment: rows[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM comments WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )
    if (!rowCount) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
