-- FINAL PERMISSIONS FIX FOR ADMINS
-- Ensure Admins can SUSPEND (Update), BAN (Update), and DELETE on all core tables.

-- 1. PROFILES (Users/Pet Owners)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

CREATE POLICY "Admins can delete any profile" 
ON public.profiles FOR DELETE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );


-- 2. SHOPS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update all shops" ON public.shops;
DROP POLICY IF EXISTS "Admins can delete all shops" ON public.shops;

CREATE POLICY "Admins can update all shops" 
ON public.shops FOR UPDATE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

CREATE POLICY "Admins can delete all shops" 
ON public.shops FOR DELETE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );


-- 3. PETS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update any pet" ON public.pets;
DROP POLICY IF EXISTS "Admins can delete any pet" ON public.pets;

CREATE POLICY "Admins can update any pet" 
ON public.pets FOR UPDATE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

CREATE POLICY "Admins can delete any pet" 
ON public.pets FOR DELETE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );
