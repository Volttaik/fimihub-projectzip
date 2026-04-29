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
