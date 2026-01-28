-- 1. Enable Vector Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to pets table
-- We use 384 dimensions for all-MiniLM-L6-v2, which is small and fast.
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Create HNSW Index for fast approximate nearest neighbor search
-- This is crucial for performance once table grows > 2000 rows.
CREATE INDEX IF NOT EXISTS idx_pets_embedding 
ON public.pets 
USING hnsw (embedding vector_cosine_ops);

-- 4. Update the RPC function to accept query_embedding interactively
-- We overload the function or replace it. Replacing is cleaner.

DROP FUNCTION IF EXISTS get_match_recommendations(uuid, int, int, jsonb);

CREATE OR REPLACE FUNCTION get_match_recommendations(
    p_user_id uuid,
    p_limit int DEFAULT 20,
    p_offset int DEFAULT 0,
    p_filters jsonb DEFAULT '{}'::jsonb,
    p_query_embedding vector(384) DEFAULT NULL -- New Argument
)
RETURNS TABLE (
    id bigint,
    name text, 
    breed text,
    age text,
    image text,
    distance text,
    match_score float,
    owner_id uuid,
    owner_profile jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lat float;
    v_lng float;
    v_preferred_breeds text[];
    v_interacted_pet_ids bigint[];
BEGIN
    -- 1. Get User Location
    SELECT latitude, longitude INTO v_lat, v_lng
    FROM public.profiles
    WHERE public.profiles.id = p_user_id;

    -- 2. Get negative interaction IDs
    SELECT array_agg(pet_id) INTO v_interacted_pet_ids
    FROM public.interactions
    WHERE user_id = p_user_id 
    AND interaction_type IN ('swipe_left', 'like', 'save', 'apply');

    -- 3. Get User Preferences (Explicit)
    SELECT array_agg(DISTINCT p.breed) INTO v_preferred_breeds
    FROM public.interactions i
    JOIN public.pets p ON p.id = i.pet_id
    WHERE i.user_id = p_user_id AND i.weight > 0;

    RETURN QUERY
    WITH scored_pets AS (
        SELECT 
            p.id,
            p.name,
            p.breed,
            p.age,
            p.image,
            p.distance,
            p.owner_id,
            p.embedding,
            -- Calculate Score
            (
                -- Base Score (Heuristic Phase 1)
                (
                    100 
                    + (CASE WHEN p.created_at > now() - interval '2 days' THEN 20 ELSE 0 END)
                    + (CASE WHEN p.breed = ANY(v_preferred_breeds) THEN 30 ELSE 0 END)
                    + (p.likes * 2) 
                    + (random() * 10)
                ) * 0.4 -- Weight Heuristic at 40%
                
                -- Vector Match Boost (Phase 2)
                -- 1 - (embedding <=> query) gives cosine similarity (-1 to 1). We map roughly to 0-100.
                -- Only calculate if embedding and query exist.
                + (
                    CASE 
                        WHEN p_query_embedding IS NOT NULL AND p.embedding IS NOT NULL 
                        THEN (1 - (p.embedding <=> p_query_embedding)) * 100 * 0.6 -- Weight Semantic at 60%
                        ELSE 0 
                    END
                )
            )::float as raw_score
        FROM public.pets p
        WHERE p.status = 'available'
        AND (v_interacted_pet_ids IS NULL OR p.id != ALL(v_interacted_pet_ids))
        AND p.owner_id != p_user_id
        AND (p_filters->>'type' IS NULL OR p_filters->>'type' = 'all' OR  p.breed ILIKE '%' || (p_filters->>'type') || '%')
    )
    SELECT 
        sp.id,
        sp.name,
        sp.breed,
        sp.age,
        sp.image,
        sp.distance,
        sp.raw_score as match_score,
        sp.owner_id,
        (SELECT row_to_json(pro) FROM public.profiles pro WHERE pro.id = sp.owner_id) as owner_profile
    FROM scored_pets sp
    ORDER BY sp.raw_score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
