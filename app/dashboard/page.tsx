import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard')

  const [profileRes, adsRes, transactionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('ads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <DashboardClient
      user={user}
      profile={profileRes.data}
      ads={adsRes.data || []}
      transactions={transactionsRes.data || []}
    />
  )
}
