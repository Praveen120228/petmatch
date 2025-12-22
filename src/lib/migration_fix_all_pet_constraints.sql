-- Unified Migration: Fix Foreign Key Constraints for Pet Deletion
-- This script updates foreign keys in 'conversations', 'likes', 'matches', and 'collection_items'
-- to ensure they handle pet deletion correctly (CASCADE or SET NULL).

BEGIN;

-- 1. CONVERSATIONS: Set pet_id to NULL if pet is deleted (Keep chat history)
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_pet_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE SET NULL;


-- 2. LIKES: Delete like if pet is deleted
ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_pet_id_fkey;

ALTER TABLE public.likes
ADD CONSTRAINT likes_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE CASCADE;


-- 3. MATCHES: Delete match if pet is deleted
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_pet_id_fkey;

ALTER TABLE public.matches
ADD CONSTRAINT matches_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE CASCADE;


-- 4. COLLECTION ITEMS: Remove from collection if pet is deleted
ALTER TABLE public.collection_items
DROP CONSTRAINT IF EXISTS collection_items_pet_id_fkey;

ALTER TABLE public.collection_items
ADD CONSTRAINT collection_items_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE CASCADE;

COMMIT;
