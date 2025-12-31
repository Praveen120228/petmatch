-- Migration: Fix Pet Status Constraints and RLS
-- Goal: Ensure 'hidden' status is allowed and admins can update it.

-- 1. Fix Check Constraint (Ensure 'hidden' is allowed)
DO $$
BEGIN
    -- Try to drop common constraint names if they exist
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_status_check;
    ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_status_check1;
    
    -- Re-add the constraint with 'hidden' included
    ALTER TABLE public.pets ADD CONSTRAINT pets_status_check 
    CHECK (status IN ('available', 'adopted', 'hidden'));
END $$;

-- 2. Fix RLS Permissions for Admins on Pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update any pet" ON public.pets;
DROP POLICY IF EXISTS "Admins can delete any pet" ON public.pets;

CREATE POLICY "Admins can update any pet" 
ON public.pets FOR UPDATE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete any pet" 
ON public.pets FOR DELETE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
