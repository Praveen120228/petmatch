import { supabase } from '../lib/supabase';
import type { Chat, Message } from '../types';

export const chatService = {
    async getConversations(userId: string): Promise<Chat[]> {
        // Fetch conversations where user is either participant
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                p1:profiles!participant_a(id, name, avatar_url),
                p2:profiles!participant_b(id, name, avatar_url)
            `)
            .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
            .order('last_message_time', { ascending: false });

        if (error) {
            console.error('Error fetching chats:', error);
            return [];
        }

        // Map to friendlier format
        return data.map((conv: any) => {
            const isA = conv.participant_a === userId;
            const otherProfile = isA ? conv.p2 : conv.p1;

            return {
                id: conv.id,
                participant_a: conv.participant_a,
                participant_b: conv.participant_b,
                pet_id: conv.pet_id,
                last_message: conv.last_message,
                last_message_time: conv.last_message_time,
                other_user: otherProfile
            };
        });
    },

    async getConversation(id: number, currentUserId: string) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                p1:profiles!participant_a(id, name, avatar_url),
                p2:profiles!participant_b(id, name, avatar_url),
                pet:pets(name, image)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching chat:', error);
            throw error;
        }

        const isA = data.participant_a === currentUserId;
        const otherProfile = isA ? data.p2 : data.p1;

        return {
            ...data,
            other_user: otherProfile
        };
    },

    async getMessages(conversationId: number, limit = 50): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false }) // Get newest first
            .limit(limit);

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        // Reverse to show oldest first in UI as usual for chat, or handle in UI. 
        // Typically chat needs oldest at top usually? 
        // If we order by created_at ascending (oldest first), limit will give us the OLDEST 50. 
        // We want the NEWEST 50. 
        // So order desc, limit, then reverse.
        return (data as Message[]).reverse();
    },

    async sendMessage(conversationId: number, senderId: string, text: string) {
        // 1. Insert Message
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                text: text
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Update Conversation metadata
        await supabase
            .from('conversations')
            .update({
                last_message: text,
                last_message_time: new Date().toISOString()
            })
            .eq('id', conversationId);

        return data;
    },

    async deleteConversation(conversationId: number) {
        const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
        if (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    },

    // Start a chat with a user (if not exists)
    async createConversation(myId: string, otherId: string, petId?: number) {
        // Check if exists
        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(participant_a.eq.${myId},participant_b.eq.${otherId}),and(participant_a.eq.${otherId},participant_b.eq.${myId})`)
            .maybeSingle();

        if (existing) return existing.id;

        // Create new
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                participant_a: myId,
                participant_b: otherId,
                pet_id: petId,
                last_message: 'Started a new conversation'
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    }
};
