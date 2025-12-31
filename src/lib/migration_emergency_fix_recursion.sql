-- EMERGENCY FIX FOR INFINITE RECURSION (UPDATED)
-- This script breaks the loop by removing any policies that might query the table itself.
-- Updated to strictly drop ALL potential conflicting policies first.

-- 1. DROP POTENTIALLY RECURSIVE FUNCTION
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. FIX PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles; -- Added this one
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles; -- Added this one
DROP POLICY IF EXISTS "admin_view_all" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;

-- Safe, Non-Recursive Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Admin Override using JWT Metadata (ZERO DB Lookups = NO Recursion)
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
);

CREATE POLICY "Admins can delete any profile" 
ON public.profiles FOR DELETE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
);


-- 3. FIX SHOPS TABLE RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Drop all shop policies
DROP POLICY IF EXISTS "Shops are viewable by everyone" ON public.shops;
DROP POLICY IF EXISTS "Users can create a shop" ON public.shops;
DROP POLICY IF EXISTS "Shop Owners can update their shop" ON public.shops;
DROP POLICY IF EXISTS "Admins can update all shops" ON public.shops;
DROP POLICY IF EXISTS "Admins can delete all shops" ON public.shops;
DROP POLICY IF EXISTS "Admins can view all shops" ON public.shops;

-- Safe Policies
CREATE POLICY "Shops are viewable by everyone" 
ON public.shops FOR SELECT 
USING ( true );

CREATE POLICY "Users can create a shop" 
ON public.shops FOR INSERT 
WITH CHECK ( auth.uid() = owner_id );

CREATE POLICY "Shop Owners can update their shop" 
ON public.shops FOR UPDATE 
USING ( auth.uid() = owner_id );

-- Admin Override (JWT Metadata)
CREATE POLICY "Admins can update all shops" 
ON public.shops FOR UPDATE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
);

CREATE POLICY "Admins can delete all shops" 
ON public.shops FOR DELETE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
);

CREATE POLICY "Admins can view all shops" 
ON public.shops FOR SELECT
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
);
