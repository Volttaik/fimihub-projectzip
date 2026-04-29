import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard')

  const [profileRes, adsRes, transactionsRes, boostUsedRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('ads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    // Detect whether the user has ever boosted before (free or paid) by looking
    // for any boost-tagged credit transaction. No DB schema change needed.
    supabase
      .from('credit_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .ilike('description', '%boost%'),
  ])

  const freeBoostAvailable = (boostUsedRes.count ?? 0) === 0

  return (
    <DashboardClient
      user={user}
      profile={profileRes.data}
      ads={adsRes.data || []}
      transactions={transactionsRes.data || []}
      freeBoostAvailable={freeBoostAvailable}
    />
  )
}
