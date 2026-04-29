import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BankAccountClient from '@/components/BankAccountClient'

export const dynamic = 'force-dynamic'

export default async function BankAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/bank-account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <BankAccountClient profile={profile} />
}
