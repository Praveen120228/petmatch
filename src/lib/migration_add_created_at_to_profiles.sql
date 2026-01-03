-- Add created_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Backfill created_at with updated_at (approximate) or now() for existing rows
UPDATE public.profiles 
SET created_at = updated_at 
WHERE created_at IS NULL;
