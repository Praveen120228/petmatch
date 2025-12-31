-- 1. Update SHOPS check constraint to allow 'suspended'
DO $$
BEGIN
    -- Drop existing check if it exists (name from previous migration)
    ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_status_check;
    
    -- Add new check with 'suspended'
    ALTER TABLE shops ADD CONSTRAINT shops_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
END $$;

-- 2. Add status column to PROFILES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active';
    END IF;

    -- Drop existing check if it really existed (unlikely for new column, but good practice)
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

    -- Add check constraint for profile status
    ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('active', 'suspended', 'banned'));
END $$;
