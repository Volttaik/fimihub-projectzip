import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { status } = await req.json()
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

    const { rowCount } = await pool.query(
      `UPDATE custom_requests SET status = $1 WHERE id = $2 AND seller_id = $3`,
      [status, id, user.id]
    )
    if (!rowCount) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
