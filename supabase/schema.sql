-- PayMini UZ schema v1 (payment-first)

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  display_name text,
  role text not null default 'client' check (role in ('owner', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_telegram_id bigint not null references profiles(telegram_id) on update cascade,
  slug text unique not null,
  name text not null,
  city text not null default 'Tashkent',
  timezone text not null default 'Asia/Tashkent',
  payme_merchant_id text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on businesses(owner_telegram_id);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  description text,
  price_uzs integer not null check (price_uzs > 0),
  type text not null default 'pay_link' check (type in ('pay_link', 'catalog', 'bookable')),
  duration_min integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists offers_business_idx on offers(business_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  offer_id uuid references offers(id) on delete set null,
  client_telegram_id bigint,
  amount_uzs integer not null check (amount_uzs > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'expired')),
  title text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists orders_business_idx on orders(business_id);
create index if not exists orders_status_idx on orders(status);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'payme',
  amount_uzs integer not null,
  external_id text,
  state integer not null default 0,
  status text not null default 'created'
    check (status in ('created', 'pending', 'paid', 'cancelled')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (provider, external_id)
);

create index if not exists payments_order_idx on payments(order_id);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

-- Anon/authenticated access for Mini App (tighten with RLS policies later)
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table offers enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table availability_rules enable row level security;

create policy "public read businesses" on businesses for select using (true);
create policy "public read offers" on offers for select using (true);
create policy "public read profiles" on profiles for select using (true);
create policy "public insert profiles" on profiles for insert with check (true);
create policy "public update profiles" on profiles for update using (true);
create policy "public insert businesses" on businesses for insert with check (true);
create policy "public update businesses" on businesses for update using (true);
create policy "public insert offers" on offers for insert with check (true);
create policy "public update offers" on offers for update using (true);
create policy "public read orders" on orders for select using (true);
create policy "public insert orders" on orders for insert with check (true);
create policy "public update orders" on orders for update using (true);
create policy "public read payments" on payments for select using (true);
create policy "public insert payments" on payments for insert with check (true);
create policy "public update payments" on payments for update using (true);
create policy "service all availability" on availability_rules for all using (true) with check (true);
