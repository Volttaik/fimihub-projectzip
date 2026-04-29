import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DiscoverClient from '@/components/DiscoverClient'
import { Skeleton } from '@/components/ui/skeleton'
import type { Ad } from '@/lib/supabase/types'

async function getAds(): Promise<Ad[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ads')
      .select('*, profiles!ads_user_id_fkey(full_name, avatar_url, email)')
      .eq('status', 'active')
      .order('is_boosted', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    if (error || !data) return []
    return data as Ad[]
  } catch {
    return []
  }
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
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
  const [ads, currentUserId] = await Promise.all([getAds(), getCurrentUserId()])
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <DiscoverSkeleton />
      </div>
    }>
      <DiscoverClient initialAds={ads} currentUserId={currentUserId} />
    </Suspense>
  )
}
