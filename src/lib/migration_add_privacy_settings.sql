-- Add show_location to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT true;
