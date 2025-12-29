-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update Profiles with Role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'shop_owner'));

-- 2. Shops Table
CREATE TABLE IF NOT EXISTS shops (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    location text NOT NULL,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Services Table
CREATE TABLE IF NOT EXISTS services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL, -- e.g. "Grooming", "Checkup"
    description text,
    duration_minutes integer NOT NULL DEFAULT 30,
    price numeric(10, 2) NOT NULL DEFAULT 0.00,
    created_at timestamptz DEFAULT now()
);

-- 4. Time Slots Table
CREATE TABLE IF NOT EXISTS time_slots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    is_booked boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    service_id uuid REFERENCES services(id) ON DELETE SET NULL,
    slot_id uuid REFERENCES time_slots(id) ON DELETE SET NULL,
    pet_details jsonb, -- Name, Breed, Age snapshot
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS POLICIES --

-- Shops: Public read, Owner write
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shops are viewable by everyone" ON shops FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own shop" ON shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own shop" ON shops FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own shop" ON shops FOR DELETE USING (auth.uid() = owner_id);

-- Services: Public read, Shop Owner write
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Shop owners can manage services" ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = services.shop_id AND shops.owner_id = auth.uid())
);

-- Time Slots: Public read, Shop Owner write
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slots are viewable by everyone" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Shop owners can manage slots" ON time_slots FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = time_slots.shop_id AND shops.owner_id = auth.uid())
);

-- Bookings: 
-- Customer can read own, Shop Owner can read own shop's bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (
    auth.uid() = customer_id
);

CREATE POLICY "Shop owners can read bookings for their shop" ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = bookings.shop_id AND shops.owner_id = auth.uid())
);

CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (
    auth.uid() = customer_id
);

CREATE POLICY "Shop owners can update booking status" ON bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = bookings.shop_id AND shops.owner_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_shop ON services(shop_id);
CREATE INDEX IF NOT EXISTS idx_slots_shop ON time_slots(shop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_shop ON bookings(shop_id);
