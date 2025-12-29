-- Phase 11: Advanced Business Features

-- 1. Shop Images Gallery Table
CREATE TABLE IF NOT EXISTS shop_images (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for shop_images
ALTER TABLE shop_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop images are viewable by everyone" ON shop_images;
CREATE POLICY "Shop images are viewable by everyone" ON shop_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Shop owners can manage their images" ON shop_images;
CREATE POLICY "Shop owners can manage their images" ON shop_images FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_images.shop_id AND shops.owner_id = auth.uid())
);

-- 2. Add Location Coordinates to Shops
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'latitude') THEN
        ALTER TABLE shops ADD COLUMN latitude double precision;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'longitude') THEN
        ALTER TABLE shops ADD COLUMN longitude double precision;
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_shop_images_shop ON shop_images(shop_id);
