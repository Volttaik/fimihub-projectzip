import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RevenueClient from '@/components/RevenueClient'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/revenue')

  const [profileRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  return <RevenueClient profile={profileRes.data} orders={ordersRes.data || []} />
}
