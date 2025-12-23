import { supabase } from './supabase';

/**
 * Service to handle file uploads to Supabase Storage.
 * Requires the following public buckets to be created in Supabase:
 * - pet-images
 * - avatars
 * - chat-images
 */
export const storageService = {
    /**
     * Uploads a file to a specific bucket.
     * @param file - The File or Blob object to upload.
     * @param bucket - The storage bucket name.
     * @param path - The desired file path (e.g., 'user-123/pet-456.png'). 
     *               If not provided, a random ID will be generated.
     */
    async uploadFile(file: File | Blob, bucket: string, path?: string): Promise<string> {
        const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const fileExt = file.type.split('/')[1] || 'png';
        const fullPath = path?.includes('.') ? path : `${fileName}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fullPath, file, {
                cacheControl: '3600',
                contentType: file.type // Explicitly set content type to avoid 400 errors
            });

        if (error) {
            console.error(`Error uploading to ${bucket}:`, JSON.stringify(error, null, 2));
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;
    },

    async uploadPetImage(file: File | Blob, userId: string): Promise<string> {
        // Organize by user ID to avoid clutter
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        return this.uploadFile(file, 'pet-images', `${userId}/${fileName}`);
    },

    async uploadAvatar(file: File | Blob, userId: string): Promise<string> {
        // Use consistent filename for avatar to avoid accumulating garbage? 
        // Or unique to avoid caching issues? Unique is safer for CDN.
        const fileName = `avatar-${Date.now()}`;
        return this.uploadFile(file, 'avatars', `${userId}/${fileName}`);
    },

    async uploadChatImage(file: File | Blob, conversationId: number): Promise<string> {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        return this.uploadFile(file, 'chat-images', `${conversationId}/${fileName}`);
    },

    /**
     * Helper to convert Base64 Data URL to Blob for uploading.
     */
    base64ToBlob(base64: string): Blob {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }
};
