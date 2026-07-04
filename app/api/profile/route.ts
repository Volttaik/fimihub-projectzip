import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'

/** PATCH /api/profile — update avatar_url or other safe profile fields */
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = ['avatar_url', 'full_name', 'phone', 'location', 'bio', 'specialisations']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const keys = Object.keys(updates)
    const vals = keys.map(k => updates[k])
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
    vals.push(user.id)

    const { rows } = await pool.query(
      `UPDATE profiles SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      vals
    )
    return NextResponse.json({ profile: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
