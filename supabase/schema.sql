-- Pokemon Card Tracker database schema
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  pokemon_tcg_id text unique not null,
  name text not null,
  set_id text,
  set_name text,
  card_number text,
  rarity text,
  image_small text,
  image_large text,
  market_price numeric(12, 2),
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id uuid not null references public.cards(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  condition text not null default 'Near Mint',
  graded_company text,
  grade text,
  purchase_price numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_photos (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null references public.collection_items(id) on delete cascade,
  user_id uuid not null,
  image_path text not null,
  photo_type text not null check (photo_type in ('front', 'back', 'other')),
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id uuid not null references public.cards(id) on delete cascade,
  target_price numeric(12, 2),
  priority text not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, card_id)
);

alter table public.cards enable row level security;
alter table public.collection_items enable row level security;
alter table public.card_photos enable row level security;
alter table public.wishlist_items enable row level security;

create policy "Cards are readable by everyone" on public.cards for select using (true);
create policy "Authenticated users can add cards" on public.cards for insert with check (auth.role() = 'authenticated');

create policy "Users can read their collection" on public.collection_items for select using (auth.uid() = user_id);
create policy "Users can insert their collection" on public.collection_items for insert with check (auth.uid() = user_id);
create policy "Users can update their collection" on public.collection_items for update using (auth.uid() = user_id);
create policy "Users can delete their collection" on public.collection_items for delete using (auth.uid() = user_id);

create policy "Users can read their photos" on public.card_photos for select using (auth.uid() = user_id);
create policy "Users can insert their photos" on public.card_photos for insert with check (auth.uid() = user_id);
create policy "Users can delete their photos" on public.card_photos for delete using (auth.uid() = user_id);

create policy "Users can read their wishlist" on public.wishlist_items for select using (auth.uid() = user_id);
create policy "Users can insert their wishlist" on public.wishlist_items for insert with check (auth.uid() = user_id);
create policy "Users can update their wishlist" on public.wishlist_items for update using (auth.uid() = user_id);
create policy "Users can delete their wishlist" on public.wishlist_items for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('card-photos', 'card-photos', false)
on conflict (id) do nothing;
