-- Add state and country columns to shops table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'state') THEN
        ALTER TABLE shops ADD COLUMN state text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'country') THEN
        ALTER TABLE shops ADD COLUMN country text;
    END IF;
END $$;
