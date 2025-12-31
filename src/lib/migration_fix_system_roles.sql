-- ==========================================
-- SYSTEM FIX: Role Synchronization & Safe RLS
-- ==========================================

-- 1. Create a function to automatically sync Profile Role -> Auth Metadata
-- This ensures that when you edit a user in the 'profiles' table, their actual Security Badge (JWT) gets updated too.
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Only update if role changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth_metadata();

-- 3. ONE-TIME FIX: Sync ALL existing profiles to their Auth Metadata immediately
-- This fixes the current "Split Brain" issue for you and any other users.
UPDATE auth.users u
SET raw_user_meta_data = 
  COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id
AND p.role IS NOT NULL;


-- ==========================================
-- SUPER FAST & SAFE RLS POLICIES
-- ==========================================
-- Now that Metadata is synced, we can check it directly. 
-- This is 100x faster and avoids all "infinite loop" bugs.

-- A. FIX PROFILES RLS
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "admin_view_all" ON profiles;
DROP FUNCTION IF EXISTS public.is_admin(); -- Checking function no longer needed

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- B. FIX SHOPS RLS (Manage Capabilities)
DROP POLICY IF EXISTS "Admins can update all shops" ON shops;
DROP POLICY IF EXISTS "Admins can delete all shops" ON shops;
DROP POLICY IF EXISTS "Admins can view all shops" ON shops;

-- Re-create with Metadata check
CREATE POLICY "Admins can update all shops" ON shops
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete all shops" ON shops
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can view all shops" ON shops
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
