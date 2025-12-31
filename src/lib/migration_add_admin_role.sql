-- Add 'admin' to the allowed roles check constraint
-- First drop existing constraint if exists (assumed name based on common conventions or previous checks)
-- Warning: This might differ based on how constraints were named.
-- Safer approach: Drop if exists, add new.

DO $$
BEGIN
    -- Try to drop constraint if it exists. Name might vary, so we check standard naming or just try to replace check
    -- Assuming constraint name is "profiles_role_check" or similiar.
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    
    -- Add updated constraint
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'shop_owner', 'admin'));
END $$;

-- Policy to allow admins to see everything?
-- RLS Policies usually restrict viewing profiles.
-- We might need a policy: "Admins can view all profiles"
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Command to set the CURRENT user (you) as admin.
-- Replace 'YOUR_EMAIL' with actual email or run this for specific ID.
-- Since I don't have your exact email here easily reliable without asking, 
-- I will provide a generic query you can run in Supabase SQL Editor:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your_email@example.com';
