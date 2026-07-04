/**
 * Browser-side stub — all mutations go through API routes now.
 * This file exists only to satisfy any stray imports; components
 * that used to call createClient() have been rewritten to use fetch().
 */
export function createClient() {
  throw new Error('createClient() is not available on the client. Use fetch() to call API routes instead.')
}
export function isSupabaseConfigured() { return true }
