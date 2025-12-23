-- Add country column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
