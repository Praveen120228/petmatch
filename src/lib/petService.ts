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
                ...pet,
                likes: 0,
                distance: '1m' // constant for now
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
