import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditAdClient from '@/components/EditAdClient'

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/ad/${id}/edit`)

  const { data: ad } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .single()
  if (!ad) notFound()
  if (ad.user_id !== user.id) redirect(`/ad/${id}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('paystack_subaccount_code')
    .eq('id', user.id)
    .single()

  return (
    <EditAdClient
      ad={ad}
      hasPayoutAccount={!!profile?.paystack_subaccount_code}
    />
  )
}
