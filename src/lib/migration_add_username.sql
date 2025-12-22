-- Add username column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- Create a unique index to ensure uniqueness (case-insensitive ideally, but simple unique for now)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
