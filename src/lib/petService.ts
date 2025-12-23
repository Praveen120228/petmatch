import { supabase } from '../lib/supabase';
import type { Pet } from '../types';

export const petService = {
    async getAllPets(currentUserId: string): Promise<Pet[]> {
        const { data, error } = await supabase
            .from('pets')
            .select('*, partner_pet_id')
            .neq('owner_id', currentUserId);

        if (error) {
            console.error('Error fetching pets:', error);
            return [];
        }
        return data as Pet[];
    },

    async getPetsPaginated(
        currentUserId: string,
        page: number = 1,
        limit: number = 20,
        filters?: {
            type?: string;
            breeds?: string[];
            ages?: string[];
            search?: string;
        }
    ): Promise<{ data: Pet[]; count: number }> {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('pets')
            .select(`
                id, name, image, breed, age, gender, type, distance, owner_id, partner_pet_id,
                owner_profile:profiles!owner_id(location, latitude, longitude, show_location, username, avatar_url)
            `, { count: 'exact' })
            .neq('owner_id', currentUserId)
            .range(from, to);

        if (filters?.type && filters.type !== 'all') {
            query = query.eq('type', filters.type);
        }

        if (filters?.breeds && filters.breeds.length > 0) {
            query = query.in('breed', filters.breeds);
        }

        if (filters?.ages && filters.ages.length > 0) {
            query = query.in('age', filters.ages);
        }

        if (filters?.search) {
            // "search" matches name OR breed OR owner username.
            // Note: Referencing the foreign table alias for filtering requires Supabase support.
            // If direct alias reference fails, we might need a separate filter or raw PostgREST syntax.
            // Trying standard embedded filter syntax:
            query = query.or(`name.ilike.%${filters.search}%,breed.ilike.%${filters.search}%`);
            // TODO: Deep filtering in OR is complex in Supabase JS. For now, let's keep it simple.
            // To properly support username search, we might need to filter the embedded resource.
            // query = query.filter('owner_profile.username', 'ilike', `%${filters.search}%`); // This ANDs it.

            // To do OR across tables, we really need a View or Search Index. 
            // For now, I will NOT break the query with an invalid OR. 
            // I will add the column to select, so at least client-side filtering could work if we fetched all, 
            // but for pagination we rely on DB. 
            // Let's rely on name/breed for now to be safe, unless valid syntax is confirmed.
            // Actually, let's try to pass it if the user explicitly typed @username?
            if (filters.search.startsWith('@')) {
                // precise username search on foreign table? 
                // It's hard to mix "OR name OR username" without !inner join impacting results.
            }
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching paginated pets:', error);
            return { data: [], count: 0 };
        }
        return { data: data as unknown as Pet[], count: count || 0 };
    },

    async getUserPets(userId: string): Promise<Pet[]> {
        const { data, error } = await supabase
            .from('pets')
            .select('*, partner_pet_id')
            .eq('owner_id', userId);

        if (error) {
            console.error('Error fetching user pets:', error);
            return [];
        }
        return data as Pet[];
    },

    async getPet(id: number): Promise<Pet | null> {
        const { data, error } = await supabase
            .from('pets')
            .select(`
                *,
                owner_profile:profiles!owner_id(name, location, latitude, longitude, show_location, avatar_url, username)
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return data as Pet;
    },

    async getPetsByIds(ids: number[]): Promise<Pet[]> {
        if (!ids.length) return [];
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .in('id', ids);

        if (error) {
            console.error('Error fetching pets by IDs:', error);
            return [];
        }
        return data as Pet[];
    },

    async createPet(pet: Omit<Pet, 'id' | 'likes' | 'distance'> & { color?: string }) {
        const { data, error } = await supabase
            .from('pets')
            .insert({
                name: pet.name,
                breed: pet.breed,
                type: (pet as any).type, // safely access if type definition is lagging
                age: pet.age,
                gender: pet.gender,
                color: pet.color, // Added color
                image: pet.image,
                images: pet.images,
                bio: pet.bio,
                traits: pet.traits,
                owner_id: pet.owner_id,
                distance: '1m',
                likes: 0
            })
            .select()
            .single();

        if (error) {
            console.error("Pet Creation Error:", error);
            throw error;
        }
        return data;
    },

    async updatePet(id: number, updates: Partial<Pet>) {
        const { data, error } = await supabase
            .from('pets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating pet:', error);
            throw error;
        }
        return dataForUpdate(data);
    },

    async deletePet(id: number) {
        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting pet:', error);
            throw error;
        }
        return true;
    }
};

// Helper to handle any specific data transformation if needed, currently passthrough
const dataForUpdate = (data: any) => data;
