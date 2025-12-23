-- FIX: Row Level Security (RLS) Policies
-- Run this script in the Supabase SQL Editor to fix "Status 406", "Status 409", and "StorageApiError: new row violates row-level security policy".

-- 1. Enable Storage RLS (Standard Practice)
-- Ensure RLS is enabled on objects table (usually is by default, but good to be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Storage Policies (Allow Authenticated Users to Upload)
-- We need to drop existing policies first to avoiding conflicts if they exist partially.

-- Bucket: pet-images
DROP POLICY IF EXISTS "Public Access for pet-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for pet-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for pet-images" ON storage.objects;

CREATE POLICY "Public Access for pet-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pet-images' );

CREATE POLICY "Auth Upload for pet-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'pet-images' );

CREATE POLICY "Auth Update for pet-images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'pet-images' );

-- Bucket: avatars
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for avatars" ON storage.objects;

CREATE POLICY "Public Access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Auth Upload for avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Auth Update for avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- Bucket: chat-images
DROP POLICY IF EXISTS "Public Access for chat-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for chat-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for chat-images" ON storage.objects;

CREATE POLICY "Public Access for chat-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-images' );

CREATE POLICY "Auth Upload for chat-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-images' );

CREATE POLICY "Auth Update for chat-images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'chat-images' )
WITH CHECK ( bucket_id = 'chat-images' );


-- 3. Profiles Table Policies (Fixing 406/409 Errors)
-- 406 errors usually mean RLS blocked the SELECT or INSERT. 
-- 409 means Conflict (Row already exists), so we need to ensure Upsert is allowed.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow public read
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING ( true );

-- Allow users to insert their *own* profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- Allow users to update their *own* profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );
