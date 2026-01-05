-- Migration to convert shop_type from text to text[]

-- 1. Alter the column type, converting existing strings to single-item arrays
-- We use a safe conversion: if null, empty array; otherwise wrap the single string in an array.
ALTER TABLE public.shops
ALTER COLUMN shop_type TYPE text[]
USING CASE
    WHEN shop_type IS NULL THEN '{}'::text[]
    ELSE ARRAY[shop_type]
END;

-- 2. Set default to empty array
ALTER TABLE public.shops
ALTER COLUMN shop_type SET DEFAULT '{}';

-- 3. Update RLS or constraints if any (None strictly required for this simple change, but good to be aware)
