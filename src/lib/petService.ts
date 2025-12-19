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
