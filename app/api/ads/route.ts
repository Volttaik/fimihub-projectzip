import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import pool from '@/lib/db'
import { FREE_POSTS_LIMIT, POST_COST_CREDITS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      title, description, category, price, price_type, location,
      contact_email, contact_phone, tags, media, quantity, accept_payments,
    } = body

    if (!title || !description || !category || !location || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check free post quota
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM ads WHERE user_id = $1`,
      [user.id]
    )
    const postCount = parseInt(countRows[0]?.cnt ?? '0', 10)
    const isFree = postCount < FREE_POSTS_LIMIT

    if (!isFree) {
      // Deduct credits
      const { rows: profileRows } = await pool.query(
        `SELECT credits FROM profiles WHERE id = $1`,
        [user.id]
      )
      const credits = profileRows[0]?.credits ?? 0
      if (credits < POST_COST_CREDITS) {
        return NextResponse.json({ error: 'Not enough credits to post' }, { status: 402 })
      }
      await pool.query(`UPDATE profiles SET credits = credits - $1 WHERE id = $2`, [POST_COST_CREDITS, user.id])
      await pool.query(
        `INSERT INTO credit_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)`,
        [user.id, POST_COST_CREDITS, 'spend', `Ad post: ${title}`]
      )
    }

    const tagsArray = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [])
    const mediaJson = JSON.stringify(media ?? [])

    const { rows } = await pool.query(
      `INSERT INTO ads (user_id, title, description, category, price, price_type, location, contact_email, contact_phone, tags, media, quantity, accept_payments, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::text[],$12,$13,'active')
       RETURNING *`,
      [
        user.id, title, description, category,
        price || null, price_type || 'fixed',
        location, contact_email, contact_phone || null,
        tagsArray, mediaJson,
        quantity ? parseInt(quantity, 10) : null,
        !!accept_payments,
      ]
    )

    return NextResponse.json({ ad: rows[0] })
  } catch (err: any) {
    console.error('Create ad error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create ad' }, { status: 500 })
  }
}
