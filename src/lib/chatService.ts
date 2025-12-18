import { supabase } from './supabase';

export interface ChatMessage {
    id: number;
    conversation_id: number;
    sender_id: string;
    text: string;
    created_at: string;
    read: boolean;
}

export interface Conversation {
    id: number;
    participant_a: string;
    participant_b: string;
    pet_id?: number | null;
    last_message: string;
    last_message_time: string;
}

export const chatService = {
    // Get all conversations for a user
    async getConversations(userId: string) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        pet:pets(name, image)
      `)
            .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
            .order('last_message_time', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get specific conversation
    async getConversation(id: number) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
        *,
        participant_a_profile:profiles!participant_a(name, avatar_url),
        participant_b_profile:profiles!participant_b(name, avatar_url),
        pet:pets(name, image, owner_id)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Get messages for a conversation
    async getMessages(conversationId: number) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Send a message
    async sendMessage(conversationId: number, senderId: string, text: string) {
        // 1. Insert Message
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                text
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Update Conversation Last Message
        await supabase
            .from('conversations')
            .update({
                last_message: text,
                last_message_time: new Date().toISOString()
            })
            .eq('id', conversationId);

        return data;
    },

    // Create or Get Conversation
    async createConversation(currentUserId: string, otherUserId: string, petId?: number) {
        // Check if exists
        // Complex query due to "who is a and b"
        // Simplified: just try to find one.
        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(participant_a.eq.${currentUserId},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${currentUserId})`)
            .maybeSingle();

        if (existing) return existing.id;

        // Create new
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                participant_a: currentUserId,
                participant_b: otherUserId,
                pet_id: petId,
                last_message: 'Started conversation',
                last_message_time: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    }
};
