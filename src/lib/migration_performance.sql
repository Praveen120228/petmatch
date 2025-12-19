-- Indexes for foreign keys to speed up joins and filtering
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_pet_id ON public.collection_items(pet_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Indexes for frequently used queries
-- For finding conversations where user is participant A or B
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_a, participant_b);
-- For sorting conversations by last message
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON public.conversations(last_message_time DESC);

-- Composite index for likes lookup (though PK might cover this, good to be explicit if PK order differs or for specific lookups)
-- PK is (user_id, pet_id) so user_id lookup is fast. 
-- However, we often check if a SPECIFIC pet is liked by a user.
-- The PK (user_id, pet_id) covers "find all likes for user" and "find specific like".
-- We might want an index on pet_id if we ever count likes (e.g. "how many likes does this pet have?").
CREATE INDEX IF NOT EXISTS idx_likes_pet_id ON public.likes(pet_id);
