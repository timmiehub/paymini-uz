-- Fix RLS for Telegram Mini App (anon key, no Supabase Auth)
-- Run in Supabase SQL Editor if onboarding fails

create policy "anon select profiles" on profiles for select using (true);
create policy "anon select businesses" on businesses for select using (true);
create policy "anon select offers" on offers for select using (true);
create policy "anon select orders" on orders for select using (true);
create policy "anon select payments" on payments for select using (true);

-- upsert on profiles needs select + insert + update (already have insert/update in schema)
