import { supabase } from './supabase';

export interface DateRequest {
    id: number;
    requester_pet_id: number;
    target_pet_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    requester?: any; // Joined data
    target?: any; // Joined data
}

export const dateService = {

    // Send a date request
    async sendRequest(requesterPetId: number, targetPetId: number) {
        // 1. Check if either is already taken (Double check backend)
        const { data: requester } = await supabase.from('pets').select('partner_pet_id').eq('id', requesterPetId).single();
        const { data: target } = await supabase.from('pets').select('partner_pet_id').eq('id', targetPetId).single();

        if (requester?.partner_pet_id || target?.partner_pet_id) {
            throw new Error("One of the pets is already in a relationship.");
        }

        // 2. Check if request already exists
        const { data: existing } = await supabase
            .from('dating_requests')
            .select('*')
            .or(`and(requester_pet_id.eq.${requesterPetId},target_pet_id.eq.${targetPetId}),and(requester_pet_id.eq.${targetPetId},target_pet_id.eq.${requesterPetId})`)
            .eq('status', 'pending')
            .single();

        if (existing) {
            throw new Error("A pending request already exists between these pets.");
        }

        const { error } = await supabase
            .from('dating_requests')
            .insert({
                requester_pet_id: requesterPetId,
                target_pet_id: targetPetId,
                status: 'pending'
            });

        if (error) throw error;
    },

    // Get requests where my pet is the TARGET (Incoming)
    async getIncomingRequests(userPetIds: number[]) {
        if (userPetIds.length === 0) return [];

        const { data, error } = await supabase
            .from('dating_requests')
            .select(`
                *,
                requester:pets!dating_requests_requester_pet_id_fkey (
                    id, name, image, breed, age, owner_id
                )
            `)
            .in('target_pet_id', userPetIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as DateRequest[];
    },

    // Accept a request
    async acceptRequest(requestId: number) {
        // Transaction-like logic via Supabase (or sequential ops)
        // 1. Get request details
        const { data: req } = await supabase.from('dating_requests').select('*').eq('id', requestId).single();
        if (!req) throw new Error("Request not found");

        // 2. Verify availability again
        const { data: requester } = await supabase.from('pets').select('partner_pet_id').eq('id', req.requester_pet_id).single();
        const { data: target } = await supabase.from('pets').select('partner_pet_id').eq('id', req.target_pet_id).single();

        if (requester?.partner_pet_id || target?.partner_pet_id) {
            // Auto-reject if taken? Or error?
            throw new Error("One of the pets is no longer available.");
        }

        // 3. Update Request Status
        const { error: updateError } = await supabase
            .from('dating_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // 4. Set Partners (Exclusivity)
        await supabase.from('pets').update({ partner_pet_id: req.target_pet_id }).eq('id', req.requester_pet_id);
        await supabase.from('pets').update({ partner_pet_id: req.requester_pet_id }).eq('id', req.target_pet_id);

        // 5. Cancel or Reject all other pending requests involving these two? (Optional polish)
    },

    // Reject a request
    async rejectRequest(requestId: number) {
        const { error } = await supabase
            .from('dating_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);
        if (error) throw error;
    },

    // Break up
    async breakUp(petId: number) {
        // Find partner
        const { data: pet } = await supabase.from('pets').select('partner_pet_id').eq('id', petId).single();
        if (!pet?.partner_pet_id) return;

        const partnerId = pet.partner_pet_id;

        // Clear both
        // Using Promise.all for speed, though not atomic without RPC
        await Promise.all([
            supabase.from('pets').update({ partner_pet_id: null }).eq('id', petId),
            supabase.from('pets').update({ partner_pet_id: null }).eq('id', partnerId)
        ]);

        // Also update the request status to rejected/cancelled? Not strictly needed for logic but good for history.
        // For now, simple nullifying is enough.
    },

    async getDateInfo(petId: number) {
        const { data, error } = await supabase
            .from('pets')
            .select(`
                partner_pet_id,
                partner:pets!pets_partner_pet_id_fkey (
                    id, name, image, breed, owner_id
                )
            `)
            .eq('id', petId)
            .single();

        if (error) return null;
        return data;
    }
};
