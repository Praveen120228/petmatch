import { supabase } from '../lib/supabase';
import type { Pet } from '../types';

export const petService = {
    async getAllPets(currentUserId: string): Promise<Pet[]> {
        const { data, error } = await supabase
            .from('pets')
            .select('*')
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
            .select('id, name, image, breed, age, type, distance, owner_id', { count: 'exact' })
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
            // "search" matches name OR breed. 
            // supabase .or() syntax: 'name.ilike.%query%,breed.ilike.%query%'
            query = query.or(`name.ilike.%${filters.search}%,breed.ilike.%${filters.search}%`);
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
            .select('*')
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
                owner_profile:profiles!owner_id(name)
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

    async createPet(pet: Omit<Pet, 'id' | 'likes' | 'distance'>) {
        const { data, error } = await supabase
            .from('pets')
            .insert({
                name: pet.name,
                breed: pet.breed,
                type: (pet as any).type, // safely access if type definition is lagging
                age: pet.age,
                gender: pet.gender,
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
    }
};
