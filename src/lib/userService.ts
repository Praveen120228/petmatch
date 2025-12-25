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
    country?: string;
    state?: string;
    phone_number?: string;
    ip_address?: string; // Added IP address
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

    async captureIpAddress(userId: string) {
        try {
            // 1. Fetch IP from public API
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) throw new Error('Failed to fetch IP');
            const { ip } = await response.json();

            if (!ip) return;

            // 2. Fetch current stored IP to avoid unnecessary writes
            const { data: profile } = await supabase
                .from('profiles')
                .select('ip_address')
                .eq('id', userId)
                .single();

            // 3. Update if different
            if (profile?.ip_address !== ip) {
                console.log("Auth: Updating user IP address");
                await supabase
                    .from('profiles')
                    .update({ ip_address: ip, updated_at: new Date().toISOString() })
                    .eq('id', userId);
            }
        } catch (err) {
            console.error('Error capturing IP address:', err);
            // Fail silently, not critical
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
    },

    async checkUsernameAvailability(username: string, currentUserId: string): Promise<boolean> {
        if (!username) return false;

        // Check if any OTHER profile (not current user) has this username
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .neq('id', currentUserId)
            .maybeSingle();

        if (error) {
            console.error("Error checking username:", error);
            return false; // Assume unavailable on error safety
        }

        return !data; // If data exists, username is taken (return false). If no data, available (true).
    }
};
