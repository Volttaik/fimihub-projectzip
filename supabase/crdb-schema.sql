-- CockroachDB schema for FimiHub
-- Run this in the CockroachDB SQL shell or console once.
-- CockroachDB uses gen_random_uuid() instead of uuid_generate_v4().
-- No RLS, no auth.users, no storage.buckets — all handled in application code.

-- ──────────────────────────────────────────────────────────────────────────────
-- PROFILES (combines Supabase auth.users + public.profiles)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INT NOT NULL DEFAULT 0,
  phone TEXT,
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('male','female','other','prefer_not_to_say')),
  location TEXT,
  bio TEXT,
  specialisations TEXT[] NOT NULL DEFAULT '{}',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  paystack_subaccount_code TEXT,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- ADS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('products','services','rentals','business')),
  price NUMERIC,
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','negotiable','free','per_month','per_hour')),
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rejected','sold','expired')),
  views INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  boost_expires_at TIMESTAMPTZ,
  media JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  quantity INT,
  accept_payments BOOLEAN NOT NULL DEFAULT FALSE,
  requires_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ads_user_id_idx ON ads (user_id);
CREATE INDEX IF NOT EXISTS ads_status_idx ON ads (status);
CREATE INDEX IF NOT EXISTS ads_category_idx ON ads (category);

-- ──────────────────────────────────────────────────────────────────────────────
-- CREDIT TRANSACTIONS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase','spend','refund')),
  description TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions (user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- SAVES
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saves (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ad_id)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- ORDERS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  quantity INT NOT NULL DEFAULT 1,
  amount_kobo INT NOT NULL DEFAULT 0,
  seller_amount_kobo INT NOT NULL DEFAULT 0,
  platform_fee_kobo INT NOT NULL DEFAULT 0,
  paystack_reference TEXT UNIQUE,
  ad_title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('placed','pending','paid','failed','cancelled','accepted','declined','fulfilled')),
  shipping_address TEXT,
  shipping_state TEXT,
  shipping_city TEXT,
  delivery_notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON orders (seller_id);
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON orders (buyer_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'inquiry' CHECK (kind IN ('inquiry','request','order')),
  reference_id UUID,
  subject TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx ON conversations (buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx ON conversations (seller_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- MESSAGES
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_ad_id_idx ON comments (ad_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- AD VIEWS (unique per user per ad)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_views (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ad_id)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- EMAIL VERIFICATION TOKENS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- PASSWORD RESET TOKENS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- CUSTOM REQUESTS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  message TEXT NOT NULL,
  budget NUMERIC,
  quantity INT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','responded','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_requests_seller_id_idx ON custom_requests (seller_id);
