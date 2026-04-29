import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostAdClient from '@/components/PostAdClient'

export default async function PostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/post')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, paystack_subaccount_code')
    .eq('id', user.id)
    .single()

  return (
    <PostAdClient
      userId={user.id}
      userEmail={user.email || ''}
      credits={profile?.credits || 0}
      hasPayoutAccount={!!profile?.paystack_subaccount_code}
    />
  )
}
