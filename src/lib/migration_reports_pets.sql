-- Add reported_pet_id to reports table
ALTER TABLE public.reports 
ADD COLUMN reported_pet_id bigint REFERENCES public.pets(id) ON DELETE CASCADE;

-- Ensure at least one target is present (Optional validation, good for data integrity)
-- We won't enforce a database CHECK constraint rigidly to avoid breaking existing insertions if any,
-- but practically the app should ensure one is set.

-- Verify RLS policies cover the new column (Existing policies are on table level, so INSERT/SELECT are fine)
-- No new policies needed as the table itself is already secured.
