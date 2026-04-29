import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostAdClient from '@/components/PostAdClient'

export const FREE_POSTS_LIMIT = 3
export const POST_COST_CREDITS = 5

export default async function PostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/post')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, paystack_subaccount_code')
    .eq('id', user.id)
    .single()

  const { count: postCount } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const usedPosts = postCount || 0
  const freePostsRemaining = Math.max(0, FREE_POSTS_LIMIT - usedPosts)

  return (
    <PostAdClient
      userId={user.id}
      userEmail={user.email || ''}
      credits={profile?.credits || 0}
      hasPayoutAccount={!!profile?.paystack_subaccount_code}
      freePostsRemaining={freePostsRemaining}
      postCostCredits={POST_COST_CREDITS}
    />
  )
}
