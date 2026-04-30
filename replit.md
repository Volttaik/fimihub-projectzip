# FimiHub

Next.js 15 marketplace app for **students and business owners** to post and discover ad spaces (products, services, rentals, business). Uses Supabase for auth/database/storage and Paystack for payments.

## Brand
- The official app name is **FimiHub** (camel case). Use it everywhere — header, manifest, page titles, emails, metadata.
- Positioning: trusted marketplace for students & business owners. Do **not** use region-specific framing (e.g. "African marketplace").
- Splash screen: `components/SplashScreen.tsx` shows a centered spinner overlay on initial load (covers the PWA icon-splash transition). Hides on `window.load` with a 2.5s hard-cap fallback.
- Install prompt: `components/InstallPrompt.tsx` shows on every page load until the PWA is actually installed (no localStorage persistence). Listens for `beforeinstallprompt`, hides on `appinstalled`. iOS Safari gets manual Add-to-Home-Screen instructions.

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

## Owner-side editing, fulfillment toggle, profile picture (2026-04-29)
- Edit ad: `app/ad/[id]/edit/page.tsx` (server, ownership-checked) + `components/EditAdClient.tsx` (single-page form). Edit buttons added to `components/DashboardClient.tsx` (per-ad row) and the owner sidebar in `components/AdDetailClient.tsx`.
- Fulfillment mode toggle in EditAdClient: seller picks **Payment** (Buy Now → Paystack) **OR** **Order** (Place Order → inbox chat) — they're mutually exclusive on the buyer side now (`canOrder` requires `!ad.accept_payments`).
- Shipping toggle: when Payment mode is on, seller can mark **Requires shipping** (`ads.requires_shipping`). Checkout then asks the buyer for street address, city, state, and delivery notes; otherwise it skips that section.
- Two-step checkout in `AdDetailClient`: Step 1 (contact + shipping if needed), **Next →**, Step 2 (review + Pay with Paystack).
- Post-payment notifications in `app/api/paystack/webhook/route.ts`: after `charge.success` for an order, the webhook now (a) calls `sendOrderEmails` so buyer gets a confirmation Gmail and seller gets a sale Gmail, and (b) opens an `order` `conversations` row + opening message so both parties have an inbox thread (idempotent via `reference_id` lookup).
- Profile picture: `components/AvatarUploader.tsx` — clickable avatar circle that uploads to the new `avatars` storage bucket (path `<user_id>/<uuid>.<ext>`) and updates `profiles.avatar_url`. Mounted in `DashboardClient` header.
- DB migration: `supabase/migrations/2026-04-29-fulfillment-and-shipping.sql` — adds `ads.requires_shipping`, `orders.shipping_address|shipping_state|shipping_city|delivery_notes`, plus the `avatars` storage bucket and per-user RLS policies. Must be run in Supabase SQL editor before these features work in prod.

## Views, orders, inbox
- Views are unique per logged-in user via `ad_views(user_id, ad_id)` (unique constraint). Owner views and anonymous refreshes don't count. Tracked in `app/ad/[id]/page.tsx` using the admin client + `increment_ad_views` rpc.
- Buy Now (paid checkout via Paystack) and Place Order (request-style, no upfront payment) are separate buttons. Both require login; anon users get redirected to `/login?redirect=/ad/{id}`.
- Place Order → `POST /api/orders/place` creates an `orders` row (`status='placed'`, `paystack_reference` nullable) and a linked `conversations` row, then redirects buyer to `/inbox/{conversation_id}`.
- Custom Request also requires login and seeds a conversation + first message.
- Inbox: `app/inbox/page.tsx` lists conversations, `app/inbox/[id]/page.tsx` + `components/ConversationClient.tsx` provide two-way chat with Supabase realtime on the `messages` table (channel `messages:{id}`, filter `conversation_id=eq.{id}`). `bump_conversation_last_message` trigger keeps `conversations.last_message_at` fresh for sorting.
- Dashboard nav: "Requests" tab is now "Inbox" (`components/DashboardNav.tsx`).

## PWA / app icon
- Master icon: `public/icon.svg` (purple gradient + orange shopping bag — marketplace mark).
- Favicon and Apple touch icon are generated via Next.js conventions: `app/icon.tsx` (32px) and `app/apple-icon.tsx` (180px) using `ImageResponse` from `next/og`.
- 192/512 PNG icons for the manifest are served by route handlers `app/icon-192.png/route.tsx` and `app/icon-512.png/route.tsx` (also `ImageResponse`-based, marked `force-static`).
- Web manifest is generated by `app/manifest.ts` and served at `/manifest.webmanifest` (name, short_name, standalone display, theme color `#7b3fe4`, background `#f6efe2`, icons in svg + 192/512 png incl. maskable).
- `viewport.themeColor` and `metadata.appleWebApp` are set in `app/layout.tsx` so iOS treats it as an installable app.
- Service worker `public/sw.js` (cache name `FimiHub-v1`) handles install/activate/fetch with a network-first navigation strategy and cache-first for static assets. Registered client-side by `components/PWARegister.tsx` (production only) and mounted in `app/layout.tsx`.
