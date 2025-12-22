-- Migration: Fix User Deletion Database Error
-- Add ON DELETE CASCADE to all foreign keys referencing profiles (auth.users)
-- This ensures that when a user is deleted, all their associated data is also removed.

BEGIN;

-- 1. PETS (owner_id -> profiles.id)
ALTER TABLE public.pets
DROP CONSTRAINT IF EXISTS pets_owner_id_fkey;

ALTER TABLE public.pets
ADD CONSTRAINT pets_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. CONVERSATIONS (participant_a/b -> profiles.id)
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_participant_a_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_participant_a_fkey
FOREIGN KEY (participant_a)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_participant_b_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_participant_b_fkey
FOREIGN KEY (participant_b)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. MESSAGES (sender_id -> profiles.id AND conversation_id -> conversations.id)
-- Note: conversation_id cascade is crucial because conversation deletion (triggered by user deletion) needs to clean up messages.
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES public.conversations(id)
ON DELETE CASCADE;


-- 4. SOCIAL FEATURES (likes, matches, collections -> user_id)
-- LIKES
ALTER TABLE public.likes
DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes
ADD CONSTRAINT likes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- MATCHES
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_user_id_fkey;

ALTER TABLE public.matches
ADD CONSTRAINT matches_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- COLLECTIONS
ALTER TABLE public.collections
DROP CONSTRAINT IF EXISTS collections_user_id_fkey;

ALTER TABLE public.collections
ADD CONSTRAINT collections_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

COMMIT;
