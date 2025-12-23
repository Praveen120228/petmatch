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
        const { data, error } = await supabase.rpc('accept_dating_request', { request_id: requestId });

        if (error) throw error;

        // Check custom error from RPC function
        if (data && data.success === false) {
            throw new Error(data.error || "Failed to accept request");
        }
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
        // Step 1: Get the pet's partner ID
        const { data: pet, error: petError } = await supabase
            .from('pets')
            .select('partner_pet_id')
            .eq('id', petId)
            .single();

        if (petError || !pet?.partner_pet_id) return null;

        // Step 2: Fetch partner details
        const { data: partner, error: partnerError } = await supabase
            .from('pets')
            .select('id, name, image, breed, owner_id')
            .eq('id', pet.partner_pet_id)
            .single();

        if (partnerError) return null;

        return { partner };
    }
};
