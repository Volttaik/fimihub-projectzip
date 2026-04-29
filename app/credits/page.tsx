import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreditsClient from '@/components/CreditsClient'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/credits')

  const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single()
  const { data: transactions } = await supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)

  return (
    <CreditsClient
      userId={user.id}
      userEmail={user.email || ''}
      credits={profile?.credits || 0}
      transactions={transactions || []}
    />
  )
}
