-- Migration to add public_id to pets table
-- Run this in your Supabase SQL Editor

-- 1. Add the column (nullable first)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS public_id uuid DEFAULT uuid_generate_v4();

-- 2. Backfill existing NULLs (crucial for existing pets)
UPDATE pets SET public_id = uuid_generate_v4() WHERE public_id IS NULL;

-- 3. Add constraint and index
ALTER TABLE pets ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE pets ADD CONSTRAINT pets_public_id_key UNIQUE (public_id);
CREATE INDEX IF NOT EXISTS idx_pets_public_id ON pets(public_id);
