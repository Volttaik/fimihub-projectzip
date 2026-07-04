import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ad_id } = await req.json()
  if (!ad_id) return NextResponse.json({ error: 'ad_id required' }, { status: 400 })

  try {
    await pool.query(
      `INSERT INTO saves (user_id, ad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, ad_id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ad_id = req.nextUrl.searchParams.get('ad_id')
  if (!ad_id) return NextResponse.json({ error: 'ad_id required' }, { status: 400 })

  try {
    await pool.query(`DELETE FROM saves WHERE user_id = $1 AND ad_id = $2`, [user.id, ad_id])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
