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
    show_location?: boolean;
    username?: string;
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
    },

    async searchUsers(query: string) {
        if (!query) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, username')
            .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(10);

        if (error) {
            console.error("Error searching users", error);
            return [];
        }
        return data;
    }
};
