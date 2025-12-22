-- Migration: Fix foreign key constraint on conversations table
-- Enable ON DELETE SET NULL for pet_id in conversations

ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_pet_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_pet_id_fkey
FOREIGN KEY (pet_id)
REFERENCES public.pets(id)
ON DELETE SET NULL;
