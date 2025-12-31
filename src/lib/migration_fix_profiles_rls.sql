-- Fix recursive RLS policy on profiles

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Create a secure function to check admin status without triggering RLS recursion
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/admin)
-- avoiding the RLS check on 'profiles' when it runs.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 3. Re-create the policy using the secure function
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT
USING (
  is_admin()
);
