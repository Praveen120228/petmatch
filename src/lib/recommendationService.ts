import { supabase } from './supabase';
import { embeddingService } from './embeddingService';

export type InteractionType = 'like' | 'save' | 'swipe_right' | 'swipe_left' | 'apply' | 'share' | 'view' | 'dwell';

export const recommendationService = {
    // Call the server-side scoring algorithm
    async getRecommendations(
        userId: string,
        limit: number = 20,
        offset: number = 0,
        filters: any = {}
    ) {
        // Phase 2: Calculate Semantic Taste Vector
        // 1. Fetch text descriptions of pets the user liked
        // Note: For MVP we do this client side on load. In prod, this should be a background job.
        let queryEmbedding = null;
        try {
            const { data: likedPets } = await supabase
                .from('interactions')
                .select('pet:pet_id(bio, breed, traits)')
                .eq('user_id', userId)
                .in('interaction_type', ['like', 'save', 'apply'])
                .limit(5); // Take last 5 likes to form a quick taste profile

            if (likedPets && likedPets.length > 0) {
                // creating a "Taste String" to embed
                const tasteText = likedPets
                    .map((item: any) => `${item.pet.breed} ${item.pet.traits?.join(' ')} ${item.pet.bio}`)
                    .join(' . ');

                if (tasteText.length > 10) {
                    queryEmbedding = await embeddingService.generateEmbedding(tasteText);
                }
            }
        } catch (e) {
            console.warn("Failed to generate taste vector:", e);
        }

        const { data, error } = await supabase.rpc('get_match_recommendations', {
            p_user_id: userId,
            p_limit: limit,
            p_offset: offset,
            p_filters: filters,
            p_query_embedding: queryEmbedding // Pass vector to RPC
        });

        if (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }

        return data || [];
    },

    // Log user signals for the algorithm to learn
    async trackInteraction(
        userId: string,
        petId: number,
        type: InteractionType,
        meta: any = {}
    ) {
        // Define weights locally or let DB handle defaults. 
        // We'll pass explicit weights for clarity here.
        const weights: Record<InteractionType, number> = {
            apply: 10,
            save: 5,
            share: 4,
            like: 3,
            swipe_right: 2,
            dwell: 1,
            view: 1,
            swipe_left: -1
        };

        const duration = meta.duration || 0;

        // For 'dwell', we might want to cap weight or specific logic
        let weight = weights[type] || 0;
        if (type === 'dwell' && duration > 30) weight = 2; // Boost for long dwell

        const { error } = await supabase
            .from('interactions')
            .insert({
                user_id: userId,
                pet_id: petId,
                interaction_type: type,
                weight: weight,
                duration: duration,
                meta: meta
            });

        if (error) {
            // Non-blocking error logging
            console.warn('Failed to track interaction:', error.message);
        }
    }
};
