-- FIX: Row Level Security (RLS) Policies (v2 - Safer)
-- We removed the 'ALTER TABLE storage.objects' command which causes permission errors.

-- 1. Storage Policies (Bucket: pet-images)
DROP POLICY IF EXISTS "Public Access for pet-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for pet-images" ON storage.objects;

CREATE POLICY "Public Access for pet-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pet-images' );

CREATE POLICY "Auth Upload for pet-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'pet-images' );

-- 2. Storage Policies (Bucket: avatars)
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for avatars" ON storage.objects;

CREATE POLICY "Public Access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Auth Upload for avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- 3. Storage Policies (Bucket: chat-images)
DROP POLICY IF EXISTS "Public Access for chat-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for chat-images" ON storage.objects;

CREATE POLICY "Public Access for chat-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-images' );

CREATE POLICY "Auth Upload for chat-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-images' );

-- 4. Profiles Table Policies (Fixing Login/Profile Errors)
-- This is in the 'public' schema, so we CAN alter it.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING ( true );

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );
