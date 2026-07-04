import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'
import PostAdClient from '@/components/PostAdClient'
import { FREE_POSTS_LIMIT, POST_COST_CREDITS } from '@/lib/constants'

export default async function PostPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirect=/post')

  const [profileRes, countRes] = await Promise.all([
    pool.query(`SELECT credits, paystack_subaccount_code FROM profiles WHERE id = $1 LIMIT 1`, [user.id]),
    pool.query(`SELECT COUNT(*) AS cnt FROM ads WHERE user_id = $1`, [user.id]),
  ])

  const profile = profileRes.rows[0]
  const usedPosts = parseInt(countRes.rows[0]?.cnt ?? '0', 10)
  const freePostsRemaining = Math.max(0, FREE_POSTS_LIMIT - usedPosts)

  return (
    <PostAdClient
      userId={user.id}
      userEmail={user.email}
      credits={profile?.credits ?? 0}
      hasPayoutAccount={!!profile?.paystack_subaccount_code}
      freePostsRemaining={freePostsRemaining}
      postCostCredits={POST_COST_CREDITS}
    />
  )
}
