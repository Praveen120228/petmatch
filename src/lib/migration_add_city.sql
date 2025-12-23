-- Add city column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
