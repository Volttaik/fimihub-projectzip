import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdDetailClient from '@/components/AdDetailClient'
import type { Ad } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: adRaw, error } = await supabase
    .from('ads')
    .select('*, profiles!ads_user_id_fkey(full_name, avatar_url, email, phone, location, created_at)')
    .eq('id', id)
    .single()

  if (error || !adRaw) notFound()
  const ad = adRaw as unknown as Ad

  const { data: { user } } = await supabase.auth.getUser()

  // Count a unique view per logged-in viewer (skip the ad owner). Anonymous refreshes don't count.
  if (user && user.id !== ad.user_id) {
    const admin = createAdminClient()
    const { error: viewErr } = await admin
      .from('ad_views')
      .insert({ user_id: user.id, ad_id: id } as any)
    // If insert succeeded (no conflict), increment the views counter
    if (!viewErr) {
      await (admin.rpc as any)('increment_ad_views', { ad_id: id })
    }
  }

  // Get similar ads
  const { data: similar } = await supabase
    .from('ads')
    .select('*, profiles!ads_user_id_fkey(full_name)')
    .eq('category', ad.category)
    .eq('status', 'active')
    .neq('id', id)
    .limit(4)

  return (
    <AdDetailClient
      ad={ad as Ad}
      similar={(similar || []) as Ad[]}
      currentUserId={user?.id ?? null}
    />
  )
}
