import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM ads WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )
    if (!rowCount) return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = [
      'title','description','category','price','price_type','location',
      'contact_email','contact_phone','tags','media','quantity',
      'accept_payments','requires_shipping','status',
    ]
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates['updated_at'] = new Date().toISOString()
    const keys = Object.keys(updates)
    const values = keys.map(k => {
      if (k === 'tags' && Array.isArray(updates[k])) return updates[k]
      if (k === 'media') return JSON.stringify(updates[k])
      return updates[k]
    })
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
    values.push(id, user.id)

    const { rows } = await pool.query(
      `UPDATE ads SET ${setClause} WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
      values
    )
    if (!rows.length) return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
    return NextResponse.json({ ad: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
