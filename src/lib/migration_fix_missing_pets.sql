-- Fix Missing Pets: Backfill Status and Ensure Visibility

-- 1. Backfill NULL status to 'available'
-- Many legacy pets might have NULL status which excludes them from queries filtering by 'available'
UPDATE public.pets 
SET status = 'available' 
WHERE status IS NULL;

-- 2. Ensure RLS Policy is correct and permissive for 'available' pets
DROP POLICY IF EXISTS "Public pets are viewable by everyone" ON public.pets;

CREATE POLICY "Public pets are viewable by everyone" 
ON public.pets FOR SELECT 
USING (
    status = 'available' 
    OR 
    (auth.uid() = owner_id) -- Owner can see their own
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' -- Admin can see all
);
