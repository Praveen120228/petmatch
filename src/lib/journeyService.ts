import { supabase } from './supabase';

export interface Milestone {
    id: number;
    slug: string;
    title: string;
    description: string;
    order_index: number;
}

export interface UserProgress {
    milestone_slug: string;
    status: 'locked' | 'available' | 'completed' | 'skipped';
    completed_at?: string;
}

export const journeyService = {

    /**
     * Get all milestones definitions
     */
    async getMilestones(): Promise<Milestone[]> {
        const { data, error } = await supabase
            .from('journey_milestones')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get current user's progress for all milestones
     */
    async getUserProgress(userId: string): Promise<UserProgress[]> {
        const { data, error } = await supabase
            .from('user_journey_progress')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    },

    /**
     * Unlock a milestone if it's not already unlocked/completed
     */
    async unlockMilestone(userId: string, slug: string) {
        // Check if exists
        const { data } = await supabase
            .from('user_journey_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('milestone_slug', slug)
            .single();

        if (!data) {
            // Create as available
            await supabase.from('user_journey_progress').insert({
                user_id: userId,
                milestone_slug: slug,
                status: 'available'
            });
        }
    },

    /**
     * Mark a milestone as completed
     */
    async completeMilestone(userId: string, slug: string, meta: any = {}) {
        const { error } = await supabase
            .from('user_journey_progress')
            .upsert({
                user_id: userId,
                milestone_slug: slug,
                status: 'completed',
                completed_at: new Date().toISOString(),
                meta
            }, { onConflict: 'user_id,milestone_slug' });

        if (error) throw error;

        // Auto-unlock next milestone based on order
        this.unlockNextMilestone(userId, slug);
    },

    /**
     * Internal: unlock the immediate next milestone
     */
    async unlockNextMilestone(userId: string, currentSlug: string) {
        const milestones = await this.getMilestones();
        const currentIndex = milestones.findIndex(m => m.slug === currentSlug);

        if (currentIndex !== -1 && currentIndex < milestones.length - 1) {
            const nextMilestone = milestones[currentIndex + 1];
            await this.unlockMilestone(userId, nextMilestone.slug);
        }
    },

    /**
     * "AI" Tip Generator
     * Simulates intelligent coaching based on current status and context.
     */
    getPersonalizedTip(progress: UserProgress[], allMilestones: Milestone[]): { title: string, tip: string, action?: string } | null {
        // Find next 'available' or incomplete milestone
        // Simple logic: Find first one that is NOT completed

        // Sort definitions
        const sortedDefs = [...allMilestones].sort((a, b) => a.order_index - b.order_index);

        for (const def of sortedDefs) {
            const p = progress.find(pr => pr.milestone_slug === def.slug);
            const status = p?.status || 'locked';

            if (status !== 'completed') {
                // This is the active step
                switch (def.slug) {
                    case 'profile-complete':
                        return {
                            title: "First Impressions Matter",
                            tip: "Users with a profile photo get 4x more replies. Have you uploaded your best look yet?",
                            action: "/profile"
                        };
                    case 'first-like':
                        return {
                            title: "Find Your Match",
                            tip: "Our AI thinks you'd love a Golden Retriever based on your location. Go explore!",
                            action: "/match"
                        };
                    case 'first-message':
                        return {
                            title: "Break the Ice",
                            tip: "Not sure what to say? Try asking about the pet's favorite toy. It's a great conversation starter!",
                            action: "/match"
                        };
                    case 'meet-scheduled':
                        return {
                            title: "Take the Leap",
                            tip: "You've been chatting for a while. Propose a meet-up at a local park to see the chemistry in person.",
                            action: "/messages"
                        };
                    default:
                        return {
                            title: "Keep Going",
                            tip: def.description,
                            action: "/match"
                        };
                }
            }
        }

        return {
            title: "You're a Pro!",
            tip: "You've completed all basic steps. Now go find your perfect companion!",
            action: "/match"
        };
    }
};
