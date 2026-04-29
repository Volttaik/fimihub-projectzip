import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdDetailClient from '@/components/AdDetailClient'
import type { Ad } from '@/lib/supabase/types'

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ad, error } = await supabase
    .from('ads')
    .select('*, profiles(full_name, avatar_url, email, phone, location, created_at)')
    .eq('id', id)
    .single()

  if (error || !ad) notFound()

  // Increment views
  await supabase.rpc('increment_ad_views', { ad_id: id })

  // Get similar ads
  const { data: similar } = await supabase
    .from('ads')
    .select('*, profiles(full_name)')
    .eq('category', ad.category)
    .eq('status', 'active')
    .neq('id', id)
    .limit(4)

  return <AdDetailClient ad={ad as Ad} similar={(similar || []) as Ad[]} />
}
