-- FIX: Add missing columns to 'shops' table
-- Run this in Supabase SQL Editor

-- 1. Add 'city' column
ALTER TABLE shops ADD COLUMN IF NOT EXISTS city text;

-- 2. Add 'shop_type' column
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_type text;

-- 3. Add 'status' column
ALTER TABLE shops ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 4. Reload Schema Cache (This is automatic on DDL but good to note)
NOTIFY pgrst, 'reload config';
