-- Add bio and location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
ADD COLUMN IF NOT EXISTS location text DEFAULT '';

-- Ensure RLS allows updates to these columns (users can update their own profile)
-- (Existing RLS on profiles usually allows update for auth.uid() = id, assuming standard setup. 
--  If not, we might need a policy, but standard Supabase 'User Management' usually handles this.
--  Let's add a policy just in case if it's missing, or assume existing one covers it. 
--  Safest is just the columns for now as policies might be complicated to patch blindly.)
