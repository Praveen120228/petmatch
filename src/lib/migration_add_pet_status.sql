-- Add status column to pets table
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'available' CHECK (status IN ('available', 'adopted', 'hidden'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_pets_status ON public.pets(status);

-- Update RLS policies to respect status
-- 1. Public can only see 'available' pets
DROP POLICY IF EXISTS "Public pets are viewable by everyone" ON public.pets;
CREATE POLICY "Public pets are viewable by everyone" 
ON public.pets FOR SELECT 
USING (
    status = 'available' 
    OR 
    (auth.uid() = owner_id) -- Owner can see their own even if hidden
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' -- Admin can see all
);

-- 2. Owners can update their own pets (including status if we want, but usually just adopted)
-- Existing update policy might range, ensure it allows updating status. 
-- Usually "Users can update own pets".
-- We should ensure admins can update ANY pet.

DROP POLICY IF EXISTS "Admins can update any pet" ON public.pets;
CREATE POLICY "Admins can update any pet"
ON public.pets FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete any pet" ON public.pets;
CREATE POLICY "Admins can delete any pet"
ON public.pets FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
