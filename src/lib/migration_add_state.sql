-- Add state column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);
