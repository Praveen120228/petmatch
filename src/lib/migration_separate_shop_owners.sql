-- 1. Create the new table
create table if not exists public.shop_owners (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  avatar_url text,
  role text default 'shop_owner',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  status text default 'active',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable RLS
alter table public.shop_owners enable row level security;

-- 3. Policies
-- Admins can do everything
create policy "Admins can view all shop_owners" on public.shop_owners for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
create policy "Admins can update shop_owners" on public.shop_owners for update using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
create policy "Admins can delete shop_owners" on public.shop_owners for delete using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Public/Owner policies
create policy "Public shop_owners are viewable by everyone." on public.shop_owners for select using (true);
create policy "Users can insert their own shop_owner profile." on public.shop_owners for insert with check (auth.uid() = id);
create policy "Users can update own shop_owner profile." on public.shop_owners for update using (auth.uid() = id);

-- 4. Migrate existing shop owners from profiles
-- NOTE: We usage coalesce(updated_at, now()) because created_at might not exist on profiles table in some environments.
insert into public.shop_owners (id, email, name, avatar_url, created_at, role)
select 
  id, 
  email, 
  name, 
  avatar_url, 
  COALESCE(updated_at, now()) as created_at, 
  'shop_owner'
from public.profiles
where role = 'shop_owner'
on conflict (id) do nothing;
