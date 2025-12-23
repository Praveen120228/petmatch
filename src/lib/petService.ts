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
            type?: string[]; // Changed to string array
            breeds?: string[];
            ages?: string[];
            search?: string;
            distance?: number;
            userLocation?: { lat: number; lng: number } | null;
            location?: string;
            country?: string;
            state?: string; // Added state filter
            gender?: string;
        }
    ): Promise<{ data: Pet[]; count: number }> {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('pets')
            .select(`
                id, name, image, breed, age, gender, type, distance, owner_id, partner_pet_id,
                owner_profile:profiles!owner_id!inner(location, country, state, latitude, longitude, show_location, username, avatar_url)
            `, { count: 'exact' })
            .neq('owner_id', currentUserId)
            .range(from, to);

        if (filters?.type && filters.type.length > 0 && !filters.type.includes('all')) {
            query = query.in('type', filters.type);
        }

        if (filters?.breeds && filters.breeds.length > 0) {
            query = query.in('breed', filters.breeds);
        }

        if (filters?.ages && filters.ages.length > 0) {
            query = query.in('age', filters.ages);
        }

        if (filters?.gender && filters.gender !== 'all') {
            query = query.eq('gender', filters.gender);
        }

        if (filters?.search) {
            // "search" matches name OR breed OR owner location.
            query = query.or(`name.ilike.%${filters.search}%,breed.ilike.%${filters.search}%,owner_profile.location.ilike.%${filters.search}%`);
        }

        if (filters?.location) {
            query = query.ilike('owner_profile.location', `%${filters.location}%`);
        }

        if (filters?.country) {
            // Filter by dedicated country column OR fallback to location string
            query = query.or(`country.ilike.%${filters.country}%,location.ilike.%${filters.country}%`, { foreignTable: 'profiles' });
        }

        if (filters?.state) {
            // Filter by dedicated state column OR fallback to location string
            query = query.or(`state.ilike.%${filters.state}%,location.ilike.%${filters.state}%`, { foreignTable: 'profiles' });
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching paginated pets:', error);
            return { data: [], count: 0 };
        }

        let result = data as unknown as Pet[];

        if (filters?.distance && filters?.userLocation && filters.userLocation.lat && filters.userLocation.lng) {
            const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371;
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            result = result.filter(pet => {
                const owner = (pet as any).owner_profile;
                if (!owner || !owner.latitude || !owner.longitude) return false;
                const d = getDist(filters.userLocation!.lat, filters.userLocation!.lng, owner.latitude, owner.longitude);
                (pet as any).distance = `${Math.round(d)}km`;
                return d <= filters.distance!;
            });
        }

        return { data: result, count: count || 0 };
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
