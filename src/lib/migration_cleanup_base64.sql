-- PERFORMANCE FIX: Cleanup Legacy Base64 Data
-- This script clears out the massive Base64 strings that are clogging the network.
-- It will result in "broken images" for old data, but will instantly fix the 30s load times.

-- 1. Clean Pet Images
-- Only target strings starting with 'data:image' (Base64)
UPDATE pets 
SET image = NULL 
WHERE image LIKE 'data:%';

-- 2. Clean User Avatars
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE 'data:%';

-- 3. Clean Chat Images
UPDATE messages 
SET image = NULL 
WHERE image LIKE 'data:%';

-- 4. Clean Pet Gallery Images (Array)
-- This is trickier, but if you have a lot of gallery images in base64, they need to go too.
-- For now, we'll focus on the main images which are the primary blockers.
-- Advanced: You might need a more complex query for the 'images' array column if it's heavy.
