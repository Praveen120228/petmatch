-- Migration: Fix foreign key constraints on likes and matches tables
-- Enable ON DELETE CASCADE for pet_id in likes and matches

-- 1. LIKES
ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_pet_id_fkey;

ALTER TABLE public.likes
ADD CONSTRAINT likes_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE CASCADE;

-- 2. MATCHES
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_pet_id_fkey;

ALTER TABLE public.matches
ADD CONSTRAINT matches_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE CASCADE;
