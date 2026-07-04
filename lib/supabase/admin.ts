/**
 * Admin client — same query builder, no session/auth check.
 * Replaces @supabase/supabase-js admin client (service role).
 */
import { QueryBuilder } from './server'
import pool from '@/lib/db'

async function rpc(fn: string, args: Record<string, any> = {}): Promise<{ data: any; error: any }> {
  try {
    if (fn === 'increment_ad_views') {
      await pool.query(`UPDATE ads SET views = views + 1 WHERE id = $1`, [args.ad_id])
      return { data: null, error: null }
    }
    return { data: null, error: { message: `Unknown RPC: ${fn}` } }
  } catch (e: any) {
    return { data: null, error: { message: e.message } }
  }
}

export function createAdminClient() {
  return {
    from: (table: string) => new QueryBuilder(table),
    rpc,
  }
}
