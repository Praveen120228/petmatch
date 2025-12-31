-- Add status column to shops table safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='status') THEN
        ALTER TABLE shops ADD COLUMN status text DEFAULT 'pending';
    END IF;
END $$;

-- Update existing shops to 'approved' to avoid disruption
UPDATE shops SET status = 'approved' WHERE status IS NULL;

-- Add check constraint safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shops_status_check') THEN
        ALTER TABLE shops ADD CONSTRAINT shops_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;
