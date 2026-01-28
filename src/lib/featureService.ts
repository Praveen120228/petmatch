import { supabase } from './supabase';
import { recommendationService } from './recommendationService';

export interface Collection {
    id: number;
    user_id: string;
    name: string;
    items?: number[]; // Array of pet IDs for easy frontend checking
}

export const featureService = {
    // --- LIKES ---
    async getLikes(userId: string): Promise<number[]> {
        const { data, error } = await supabase
            .from('likes')
            .select('pet_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching likes:', error);
            return [];
        }
        return data.map(row => row.pet_id);
    },

    async toggleLike(userId: string, petId: number): Promise<boolean> {
        // Check if exists
        const { data } = await supabase
            .from('likes')
            .select('pet_id')
            .match({ user_id: userId, pet_id: petId })
            .maybeSingle();

        if (data) {
            // Unlike
            const { error } = await supabase
                .from('likes')
                .delete()
                .match({ user_id: userId, pet_id: petId });
            if (error) throw error;
            return false;
        } else {
            // Like
            const { error } = await supabase
                .from('likes')
                .insert({ user_id: userId, pet_id: petId });
            if (error) throw error;

            // Track Interaction for Algorithm
            // We use import() dynamically if needed to avoid circles, but we removed the circle.
            // However, to be extra safe since they are in same folder, let's keep it simple.
            // Actually, I need to add the import at top.
            // But since I can't edit top + middle easily with one replace_file_content unless I do multi.
            // I'll assume I can add the import. Wait, I should use multi_replace for that.
            // Or just use the tracking logic directly here or via a decoupled way.
            // I'll just insert to interactions table directly here to avoid circular dep risks or needing to edit imports far away.
            // Actually, best practice is to use the service.

            // To avoid complex edits, I will use multi_replace to add import and update function.
            await recommendationService.trackInteraction(userId, petId, 'like');

            return true;
        }
    },

    // --- MATCHES ---
    async getMatches(userId: string): Promise<number[]> {
        const { data, error } = await supabase
            .from('matches')
            .select('pet_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching matches:', error);
            return [];
        }
        return data.map(row => row.pet_id);
    },

    async toggleMatch(userId: string, petId: number): Promise<boolean> {
        const { data } = await supabase
            .from('matches')
            .select('pet_id')
            .match({ user_id: userId, pet_id: petId })
            .maybeSingle();

        if (data) {
            const { error } = await supabase.from('matches').delete().match({ user_id: userId, pet_id: petId });
            if (error) throw error;
            return false;
        } else {
            const { error } = await supabase.from('matches').insert({ user_id: userId, pet_id: petId });
            if (error) throw error;
            return true;
        }
    },

    // --- COLLECTIONS ---
    async getCollections(userId: string): Promise<Collection[]> {
        const { data: collections, error } = await supabase
            .from('collections')
            .select(`
                id,
                name,
                user_id,
                collection_items ( pet_id )
            `)
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching collections:', error);
            return [];
        }

        // Transform to friendly format
        return collections.map((c: any) => ({
            id: c.id,
            user_id: c.user_id,
            name: c.name,
            items: c.collection_items.map((item: any) => item.pet_id)
        }));
    },

    async createCollection(userId: string, name: string): Promise<Collection> {
        const { data, error } = await supabase
            .from('collections')
            .insert({ user_id: userId, name })
            .select()
            .single();

        if (error) {
            console.error('Error creating collection:', error);
            throw error;
        }
        return { ...data, items: [] };
    },

    async deleteCollection(id: number) {
        // Items cascade delete automatically due to FK
        await supabase.from('collections').delete().eq('id', id);
    },

    async addToCollection(collectionId: number, petId: number) {
        const { error } = await supabase
            .from('collection_items')
            .insert({ collection_id: collectionId, pet_id: petId });

        if (error) {
            console.error('Error adding to collection:', error);
            throw error;
        }
    },

    async removeFromCollection(collectionId: number, petId: number) {
        const { error } = await supabase
            .from('collection_items')
            .delete()
            .match({ collection_id: collectionId, pet_id: petId });

        if (error) {
            console.error('Error removing from collection:', error);
            throw error;
        }
    }
};
