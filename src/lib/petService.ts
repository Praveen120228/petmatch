import { supabase } from './supabase';
import { MOCK_PETS } from '../data/mockPets';

export const petService = {
    // Get all pets (Supabase + Mocks)
    async getAllPets() {
        const { data: realPets, error } = await supabase
            .from('pets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pets:', error);
            return MOCK_PETS;
        }

        // Transform real pets to match UI expectation if needed
        // The UI expects fields like 'distance' which our SQL has.
        // We mix them.
        return [...realPets, ...MOCK_PETS];
    },

    // Get single pet
    async getPet(id: number) {
        // Check if it's a mock pet (mock IDs are usually small integers, but let's assume we can try DB first)
        const { data } = await supabase
            .from('pets')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (data) return data;

        // Fallback to mock
        return MOCK_PETS.find(p => p.id === id);
    },

    // Create Pet
    async createPet(petData: any, ownerId: string) {
        const { data, error } = await supabase
            .from('pets')
            .insert({
                ...petData,
                owner_id: ownerId,
                // Default fields
                distance: '1m',
                likes: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update Pet
    async updatePet(id: number, updates: any) {
        const { data, error } = await supabase
            .from('pets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
