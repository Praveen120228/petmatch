-- FIX: Row Level Security (RLS) Policies (v3 - Complete)
-- This version adds "UPDATE" permissions which are often required even for uploads depending on client behavior.

-- 1. Storage Policies (Bucket: pet-images)
DROP POLICY IF EXISTS "Public Access for pet-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for pet-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for pet-images" ON storage.objects;

CREATE POLICY "Public Access for pet-images" ON storage.objects FOR SELECT USING ( bucket_id = 'pet-images' );
CREATE POLICY "Auth Upload for pet-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'pet-images' );
CREATE POLICY "Auth Update for pet-images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'pet-images' );

-- 2. Storage Policies (Bucket: avatars)
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for avatars" ON storage.objects;

CREATE POLICY "Public Access for avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Auth Upload for avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Auth Update for avatars" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' );

-- 3. Storage Policies (Bucket: chat-images)
DROP POLICY IF EXISTS "Public Access for chat-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload for chat-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update for chat-images" ON storage.objects;

CREATE POLICY "Public Access for chat-images" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-images' );
CREATE POLICY "Auth Upload for chat-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'chat-images' );
CREATE POLICY "Auth Update for chat-images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'chat-images' );

-- 4. Profiles Table (Fixes Login Errors)
-- Ensure we enable RLS on 'public.profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );
