# FimiHub

Next.js 15 marketplace app for Nigerian users to post and discover ad spaces (products, services, rentals, business). Uses Supabase for auth/database/storage and Paystack for payments.

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3
- Supabase (Auth, Postgres, Storage, RLS)
- Paystack (payments + payouts)
- Nodemailer / Gmail SMTP

## Run
- Workflow `Start application` runs `npm run dev` on port 5000
- Env vars (Supabase URL/keys, Paystack, SMTP) live in `.replit` `[userenv.shared]`

## Posting rules
- First 3 posts per user are free
- After that, each post costs `POST_COST_CREDITS` (5) credits
- Credits are bought via Paystack on `/credits`
- Constants live in `app/post/page.tsx` (`FREE_POSTS_LIMIT`, `POST_COST_CREDITS`)

## Notable implementation notes
- Ads → profiles join must be disambiguated as `profiles!ads_user_id_fkey(...)` because `saves` also bridges ads ↔ profiles. Used in `app/page.tsx` and `app/ad/[id]/page.tsx`.
- Ad insert uses RLS (`auth.uid() = user_id`) and writes status='active' immediately.
- Credit deduction on paid posts is done client-side after the insert succeeds, with a matching `credit_transactions` row.

## Views, orders, inbox
- Views are unique per logged-in user via `ad_views(user_id, ad_id)` (unique constraint). Owner views and anonymous refreshes don't count. Tracked in `app/ad/[id]/page.tsx` using the admin client + `increment_ad_views` rpc.
- Buy Now (paid checkout via Paystack) and Place Order (request-style, no upfront payment) are separate buttons. Both require login; anon users get redirected to `/login?redirect=/ad/{id}`.
- Place Order → `POST /api/orders/place` creates an `orders` row (`status='placed'`, `paystack_reference` nullable) and a linked `conversations` row, then redirects buyer to `/inbox/{conversation_id}`.
- Custom Request also requires login and seeds a conversation + first message.
- Inbox: `app/inbox/page.tsx` lists conversations, `app/inbox/[id]/page.tsx` + `components/ConversationClient.tsx` provide two-way chat with Supabase realtime on the `messages` table (channel `messages:{id}`, filter `conversation_id=eq.{id}`). `bump_conversation_last_message` trigger keeps `conversations.last_message_at` fresh for sorting.
- Dashboard nav: "Requests" tab is now "Inbox" (`components/DashboardNav.tsx`).
