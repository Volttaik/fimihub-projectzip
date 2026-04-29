-- 2026-04-29: Fulfillment mode toggle, shipping fields, avatar storage bucket
-- Run this in your Supabase SQL editor once.

-- Ads: optional shipping requirement (only matters when accept_payments = true)
alter table public.ads
  add column if not exists requires_shipping boolean not null default false;

-- Orders: shipping address fields collected at checkout
alter table public.orders
  add column if not exists shipping_address text,
  add column if not exists shipping_state text,
  add column if not exists shipping_city text,
  add column if not exists delivery_notes text;

-- Storage bucket for avatars (separate from ad-media for clarity)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can view avatars
do $$ begin
  create policy "Anyone can view avatars" on storage.objects
    for select using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

-- Authenticated users can upload to their own folder (path: <user_id>/...)
do $$ begin
  create policy "Users can upload own avatar" on storage.objects
    for insert with check (
      bucket_id = 'avatars'
      and auth.role() = 'authenticated'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own avatar" on storage.objects
    for update using (
      bucket_id = 'avatars'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can delete own avatar" on storage.objects
    for delete using (
      bucket_id = 'avatars'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
exception when duplicate_object then null; end $$;
