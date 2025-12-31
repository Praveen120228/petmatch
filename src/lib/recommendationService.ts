import { supabase } from './supabase';
import { featureService } from './featureService';
import { getDistance } from '../utils/distance';

interface Pet {
    id: number;
    owner_id: string;
    name: string;
    breed: string | null;
    age: string | null;
    gender: string | null;
    image: string | null;
    images: string[] | null;
    bio: string | null;
    traits: string[] | null;
    distance: string | null; // This is the stored string, not calculated numeric distance
    latitude?: number;
    longitude?: number;
    owner_profile?: {
        latitude?: number;
        longitude?: number;
    };
}

interface UserPreferences {
    likedBreeds: Record<string, number>;
    likedTraits: Record<string, number>;
}

export const recommendationService = {
    async getRecommendations(userId: string, userLocation: { lat: number; lng: number } | null, limit: number = 5): Promise<Pet[]> {
        // 1. Fetch User History (Likes)
        const likedPetIds = await featureService.getLikes(userId);

        if (likedPetIds.length === 0) {
            // New user or no history: Return random popular pets or recent ones
            // For now, just return recent pets excluding own
            const { data: randomPets } = await supabase
                .from('pets')
                .select('*, owner_profile:owner_id(latitude, longitude)')
                .neq('owner_id', userId)
                .not('name', 'in', '("Marsh","Cookie","Leo","Whiskey")') // Filter out dummy data
                .limit(limit);
            return randomPets || [];
        }

        // 2. Fetch Liked Pets details to build preferences
        const { data: likedPets } = await supabase
            .from('pets')
            .select('breed, traits')
            .in('id', likedPetIds);

        if (!likedPets) return [];

        const preferences: UserPreferences = {
            likedBreeds: {},
            likedTraits: {}
        };

        likedPets.forEach(pet => {
            if (pet.breed) {
                preferences.likedBreeds[pet.breed] = (preferences.likedBreeds[pet.breed] || 0) + 1;
            }
            if (pet.traits && Array.isArray(pet.traits)) {
                pet.traits.forEach((trait: string) => {
                    preferences.likedTraits[trait] = (preferences.likedTraits[trait] || 0) + 1;
                });
            }
        });

        // 3. Fetch Candidates (Exclude liked and own pets)
        // Note: In a real large-scale app, we wouldn't fetch *all* candidates. 
        // We'd filter by breed first or use a specialized search engine.
        // For this scale, fetching ~100 potential matches to rank is fine.
        const { data: candidates } = await supabase
            .from('pets')
            .select('*, owner_profile:owner_id(latitude, longitude)')
            .neq('owner_id', userId)
            .not('name', 'in', '("Marsh","Cookie","Leo","Whiskey")') // Filter out dummy data
            .not('id', 'in', `(${likedPetIds.join(',')})`)
            .limit(50); // Pool of candidates to rank

        if (!candidates) return [];

        // 4. Score Candidates
        const scoredPets = candidates.map(pet => {
            const score = this.calculateScore(pet, preferences, userLocation);
            return { ...pet, score };
        });

        // 5. Rank and Return
        scoredPets.sort((a, b) => b.score - a.score);

        return scoredPets.slice(0, limit);
    },

    calculateScore(pet: Pet, preferences: UserPreferences, userLocation: { lat: number; lng: number } | null): number {
        let score = 0;

        // Breed Match (+5 per historic like of this breed)
        // We can cap this or use log scale if needed, but linear is fine for now
        if (pet.breed && preferences.likedBreeds[pet.breed]) {
            score += 5 * preferences.likedBreeds[pet.breed];
        }

        // Trait Match (+1 per matching trait instance)
        if (pet.traits && Array.isArray(pet.traits)) {
            pet.traits.forEach(trait => {
                if (preferences.likedTraits[trait]) {
                    score += 1 * preferences.likedTraits[trait];
                }
            });
        }

        // Proximity Boost (+3 if < 10km)
        if (userLocation && pet.owner_profile?.latitude && pet.owner_profile?.longitude) {
            const distStr = getDistance(
                userLocation.lat,
                userLocation.lng,
                pet.owner_profile.latitude,
                pet.owner_profile.longitude
            );

            if (distStr) {
                // getDistance returns string like "5 km" or "< 1 km"
                // Parse it roughly
                let distVal = 100; // Default high
                if (distStr.includes('<')) {
                    distVal = 0.5;
                } else {
                    distVal = parseFloat(distStr);
                }

                if (distVal <= 10) {
                    score += 3;
                }
            }
        }

        return score;
    }
};
