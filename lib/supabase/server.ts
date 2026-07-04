/**
 * Compatibility layer — replaces @supabase/ssr server client.
 * Backed by CockroachDB via lib/db.ts and custom JWT auth via lib/auth.ts.
 */
import { getUser, type SessionUser } from '@/lib/auth'
import pool from '@/lib/db'

export type AppUser = SessionUser

// ─── Minimal Query Builder ────────────────────────────────────────────────────

type Op = 'select' | 'insert' | 'update' | 'delete'
interface Cond { col: string; op: 'eq' | 'neq' | 'ilike' | 'is'; val: any }

export class QueryBuilder {
  private _table: string
  private _selectCols = '*'
  private _returning: string | null = null
  private _conditions: Cond[] = []
  private _orderCol: string | null = null
  private _orderAsc = true
  private _limitN: number | null = null
  private _op: Op = 'select'
  private _insertData: any = null
  private _updateData: any = null
  private _isCount = false
  private _headOnly = false

  constructor(table: string) { this._table = table }

  select(cols = '*', opts?: { count?: 'exact'; head?: boolean }) {
    if (this._op === 'insert' || this._op === 'update') {
      this._returning = cols
    } else {
      this._selectCols = cols
      this._op = 'select'
    }
    if (opts?.count === 'exact') this._isCount = true
    if (opts?.head) this._headOnly = true
    return this
  }

  eq(col: string, val: any) { this._conditions.push({ col, op: 'eq', val }); return this }
  neq(col: string, val: any) { this._conditions.push({ col, op: 'neq', val }); return this }
  ilike(col: string, val: string) { this._conditions.push({ col, op: 'ilike', val }); return this }
  is(col: string, val: null) { this._conditions.push({ col, op: 'is', val }); return this }
  order(col: string, opts?: { ascending?: boolean }) { this._orderCol = col; this._orderAsc = opts?.ascending !== false; return this }
  limit(n: number) { this._limitN = n; return this }
  insert(data: any) { this._op = 'insert'; this._insertData = data; return this }
  update(data: any) { this._op = 'update'; this._updateData = data; return this }
  delete() { this._op = 'delete'; return this }

  async single(): Promise<{ data: any; error: any }> {
    const r = await this._run()
    if (r.error) return { data: null, error: r.error }
    if (!r.rows?.length) return { data: null, error: { message: `${this._table}: row not found` } }
    return { data: r.rows[0], error: null }
  }
  async maybeSingle(): Promise<{ data: any; error: any }> {
    const r = await this._run()
    if (r.error) return { data: null, error: r.error }
    return { data: r.rows?.[0] ?? null, error: null }
  }

  // Thenable — allows `const { data, error } = await supabase.from(...).select(...).eq(...)`
  then<T>(
    resolve: (v: { data: any; error: any; count: number | null }) => T,
    reject?: (e: any) => any
  ) {
    return this._run()
      .then(r => resolve({ data: r.rows ?? null, error: r.error ?? null, count: r.count ?? null }))
      .catch(reject)
  }

  private async _run(): Promise<{ rows: any[] | null; error: any; count: number | null }> {
    try {
      const vals: any[] = []
      let idx = 0
      const ph = () => `$${++idx}`

      const buildWhere = () => {
        if (!this._conditions.length) return ''
        return 'WHERE ' + this._conditions.map(c => {
          if (c.op === 'is' && c.val === null) return `"${c.col}" IS NULL`
          vals.push(c.val)
          const p = ph()
          if (c.op === 'eq') return `"${c.col}" = ${p}`
          if (c.op === 'neq') return `"${c.col}" != ${p}`
          if (c.op === 'ilike') return `"${c.col}" ILIKE ${p}`
          return `"${c.col}" = ${p}`
        }).join(' AND ')
      }

      if (this._isCount) {
        const where = buildWhere()
        const res = await pool.query(`SELECT COUNT(*) AS cnt FROM "${this._table}" ${where}`, vals)
        const count = parseInt(res.rows[0]?.cnt ?? '0', 10)
        return { rows: this._headOnly ? [] : res.rows, error: null, count }
      }

      if (this._op === 'select') {
        const where = buildWhere()
        let sql = `SELECT ${this._selectCols} FROM "${this._table}" ${where}`
        if (this._orderCol) sql += ` ORDER BY "${this._orderCol}" ${this._orderAsc ? 'ASC' : 'DESC'}`
        if (this._limitN !== null) sql += ` LIMIT ${this._limitN}`
        const res = await pool.query(sql, vals)
        return { rows: res.rows, error: null, count: res.rowCount ?? null }
      }

      if (this._op === 'insert') {
        const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData]
        const cols = Object.keys(rows[0])
        const colList = cols.map(c => `"${c}"`).join(', ')
        const sets = rows.map(row => `(${cols.map(c => { vals.push(row[c]); return ph() }).join(', ')})`).join(', ')
        const ret = this._returning ? `RETURNING ${this._returning}` : 'RETURNING *'
        const res = await pool.query(`INSERT INTO "${this._table}" (${colList}) VALUES ${sets} ${ret}`, vals)
        return { rows: res.rows, error: null, count: res.rowCount ?? null }
      }

      if (this._op === 'update') {
        const data = this._updateData
        const cols = Object.keys(data)
        const setClause = cols.map(c => { vals.push(data[c]); return `"${c}" = ${ph()}` }).join(', ')
        const where = buildWhere()
        const ret = this._returning ? `RETURNING ${this._returning}` : ''
        const res = await pool.query(`UPDATE "${this._table}" SET ${setClause} ${where} ${ret}`, vals)
        return { rows: res.rows, error: null, count: res.rowCount ?? null }
      }

      if (this._op === 'delete') {
        const where = buildWhere()
        const res = await pool.query(`DELETE FROM "${this._table}" ${where}`, vals)
        return { rows: res.rows, error: null, count: res.rowCount ?? null }
      }

      return { rows: [], error: null, count: null }
    } catch (e: any) {
      console.error(`DB ${this._op} "${this._table}":`, e.message)
      return { rows: null, error: { message: e.message }, count: null }
    }
  }
}

// ─── RPC helpers ──────────────────────────────────────────────────────────────

async function rpc(fn: string, args: Record<string, any> = {}): Promise<{ data: any; error: any }> {
  try {
    if (fn === 'increment_ad_views') {
      await pool.query(`UPDATE ads SET views = views + 1 WHERE id = $1`, [args.ad_id])
      return { data: null, error: null }
    }
    if (fn === 'boost_ad') {
      const { ad_id } = args
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { rows } = await pool.query(
        `SELECT credits FROM profiles WHERE id = (SELECT user_id FROM ads WHERE id = $1)`,
        [ad_id]
      )
      if (!rows[0] || rows[0].credits < 5) return { data: null, error: { message: 'Not enough credits' } }
      await pool.query(
        `UPDATE ads SET is_boosted = TRUE, boost_expires_at = $1 WHERE id = $2`,
        [expires, ad_id]
      )
      return { data: { ok: true }, error: null }
    }
    return { data: null, error: { message: `Unknown RPC: ${fn}` } }
  } catch (e: any) {
    return { data: null, error: { message: e.message } }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export async function createClient() {
  const user: AppUser | null = await getUser()
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from: (table: string) => new QueryBuilder(table),
    rpc,
  }
}

export function isSupabaseConfigured() { return true }
