-- Add latitude and longitude to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude float8,
ADD COLUMN IF NOT EXISTS longitude float8;
