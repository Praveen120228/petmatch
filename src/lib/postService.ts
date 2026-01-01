import { supabase } from './supabase';

export interface Post {
    id: string;
    user_id: string;
    image_url: string;
    caption: string;
    tags?: string[];
    likes_count: number;
    views_count?: number; // Added views_count
    created_at: string;
    profiles?: {
        name: string;
        username: string;
        avatar_url: string;
    };
    liked_by_me?: boolean; // Virtual field for UI
}

export const postService = {
    /**
     * Get the community feed
     */
    async getFeed(currentUserId?: string): Promise<Post[]> {
        // 1. Fetch User's Pet Types (Preferences)
        let userPetTypes: string[] = [];
        if (currentUserId) {
            const { data: pets } = await supabase
                .from('pets')
                .select('type')
                .eq('owner_id', currentUserId);

            if (pets) {
                userPetTypes = pets.map((p: any) => p.type?.toLowerCase()).filter(Boolean);
            }
        }

        // 2. Fetch Recent Posts
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles!posts_user_id_fkey (name, username, avatar_url),
                post_likes (user_id)
            `)
            .order('created_at', { ascending: false })
            .limit(100); // Fetch mostly recent to rank

        if (error) throw error;

        // 3. Rank Posts
        const rankedPosts = data.map((post: any) => {
            let score = 1.0;
            const postTags = (post.tags || []).map((t: string) => t.toLowerCase());

            // Relevance: Does post tag match user's pet type?
            const matchesType = postTags.some((tag: string) => userPetTypes.includes(tag));
            if (matchesType) score += 10;

            // Popularity: Likes boost
            score += (post.likes_count || 0) * 0.5;

            // Freshness is implicitly handled by the initial sort limit, 
            // but we could add decay here if we fetched older posts.

            return {
                ...post,
                liked_by_me: currentUserId ? post.post_likes.some((l: any) => l.user_id === currentUserId) : false,
                _score: score
            };
        });

        // Sort by calculated score DESC
        rankedPosts.sort((a, b) => b._score - a._score);

        return rankedPosts as Post[];
    },

    /**
     * Get posts for a specific user
     */
    async getUserPosts(userId: string): Promise<Post[]> {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles!posts_user_id_fkey (name, username, avatar_url),
                post_likes (user_id)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((post: any) => ({
            ...post,
            liked_by_me: userId ? post.post_likes.some((l: any) => l.user_id === userId) : false,
        })) as Post[];
    },

    /**
     * Upload image and create post
     */
    async createPost(userId: string, file: File, caption: string, tags: string[] = []) {
        // 1. Upload Image
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(filePath);

        // 3. Create DB Record
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: userId,
                image_url: publicUrl,
                caption,
                tags
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Helper to determine like status and toggle it
     */
    async toggleLike(userId: string, postId: string, isCurrentlyLiked: boolean) {
        if (isCurrentlyLiked) {
            // Unlike
            const { error: unlikeError } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (unlikeError) throw unlikeError;
        } else {
            // Like
            const { error: likeError } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: userId });

            if (likeError) throw likeError;

            // Trigger will handle count update
        }
    },

    // incrementLikeCount removed - handled by DB trigger

    async deletePost(postId: string) {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);
        if (error) throw error;
    },

    async incrementView(postId: string) {
        const { error } = await supabase.rpc('increment_post_view', { post_id: postId });
        if (error) console.error("Error incrementing view:", error);
    }
};
