import { supabase } from './supabase';

export interface UserProfile {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
}

export const userService = {
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data as UserProfile;
    },

    async updateProfile(userId: string, updates: Partial<UserProfile>) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
};
