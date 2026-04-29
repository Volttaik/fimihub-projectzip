import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RequestsClient from '@/components/RequestsClient'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/requests')

  const { data: requests } = await supabase
    .from('custom_requests')
    .select('*, ad:ads(id, title)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  return <RequestsClient requests={requests || []} />
}
