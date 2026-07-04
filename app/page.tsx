import { Suspense } from 'react'
import pool from '@/lib/db'
import { getUser } from '@/lib/auth'
import DiscoverClient from '@/components/DiscoverClient'
import { Skeleton } from '@/components/ui/skeleton'
import type { Ad } from '@/lib/supabase/types'

async function getAds(): Promise<Ad[]> {
  try {
    const { rows } = await pool.query(`
      SELECT a.*,
        json_build_object(
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'email', p.email
        ) AS profiles
      FROM ads a
      LEFT JOIN profiles p ON p.id = a.user_id
      WHERE a.status = 'active'
      ORDER BY a.is_boosted DESC, a.created_at DESC
      LIMIT 100
    `)
    return rows as Ad[]
  } catch {
    return []
  }
}

function DiscoverSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default async function DiscoverPage() {
  const [ads, user] = await Promise.all([getAds(), getUser()])
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <DiscoverSkeleton />
      </div>
    }>
      <DiscoverClient initialAds={ads} currentUserId={user?.id ?? null} />
    </Suspense>
  )
}
