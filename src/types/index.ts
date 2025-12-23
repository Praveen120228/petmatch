export interface Pet {
    id: number;
    name: string;
    breed: string;
    age: string;
    gender: string;
    image?: string;
    images?: string[];
    bio: string;
    color?: string; // Added color field
    traits: string[];
    owner_id: string; // Changed from ownerId to match DB column name
    distance: string;
    likes: number;
    partner_pet_id?: number | null;
    owner_profile?: {
        name: string;
        location: string;
        country?: string;
        state?: string;
        avatar_url?: string;
        username?: string;
    };
}

export interface Chat {
    id: number;
    participant_a: string; // UUID
    participant_b: string; // UUID
    last_sender_id?: string; // UUID
    pet_id?: number;
    last_message: string;
    last_message_time: string;
    other_user?: { // Enriched property for UI
        name: string;
        avatar_url: string;
        username?: string;
    };
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: string;
    text: string;
    created_at: string;
    read: boolean;
}
