-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  credits integer not null default 0,
  phone text,
  location text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, email_verified)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'email_verified')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ads table
create table if not exists public.ads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null check (category in ('products', 'services', 'rentals', 'business')),
  price numeric,
  price_type text not null default 'fixed' check (price_type in ('fixed', 'negotiable', 'free', 'per_month', 'per_hour')),
  location text not null,
  contact_email text not null,
  contact_phone text,
  status text not null default 'active' check (status in ('pending', 'active', 'rejected', 'sold', 'expired')),
  views integer not null default 0,
  featured boolean not null default false,
  is_boosted boolean not null default false,
  boost_expires_at timestamptz,
  media jsonb not null default '[]',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ads enable row level security;

create policy "Active ads are publicly viewable" on public.ads
  for select using (status = 'active' or auth.uid() = user_id);

create policy "Users can insert own ads" on public.ads
  for insert with check (auth.uid() = user_id);

create policy "Users can update own ads" on public.ads
  for update using (auth.uid() = user_id);

create policy "Users can delete own ads" on public.ads
  for delete using (auth.uid() = user_id);

-- Increment views function
create or replace function public.increment_ad_views(ad_id uuid)
returns void as $$
  update public.ads set views = views + 1 where id = ad_id;
$$ language sql security definer;

-- Credit transactions table
create table if not exists public.credit_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  type text not null check (type in ('purchase', 'spend', 'refund')),
  description text not null,
  reference text,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- Saves table
create table if not exists public.saves (
  user_id uuid references public.profiles(id) on delete cascade,
  ad_id uuid references public.ads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ad_id)
);

alter table public.saves enable row level security;

create policy "Users can manage own saves" on public.saves
  for all using (auth.uid() = user_id);

-- Storage bucket for ad media
insert into storage.buckets (id, name, public)
values ('ad-media', 'ad-media', true)
on conflict do nothing;

create policy "Anyone can view ad media" on storage.objects
  for select using (bucket_id = 'ad-media');

create policy "Authenticated users can upload ad media" on storage.objects
  for insert with check (bucket_id = 'ad-media' and auth.role() = 'authenticated');

create policy "Users can delete own media" on storage.objects
  for delete using (bucket_id = 'ad-media' and auth.uid()::text = (storage.foldername(name))[1]);
