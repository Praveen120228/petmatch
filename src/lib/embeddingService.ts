import { pipeline } from '@xenova/transformers';

class EmbeddingService {
    private static instance: EmbeddingService;
    private pipe: any = null;
    private isLoading: boolean = false;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    private async init() {
        if (this.pipe) return;
        if (this.isLoading) {
            // Wait until loaded
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.isLoading = true;
        try {
            // Use a small, quantized model perfect for browser usage (approx 20MB)
            this.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true,
            });
        } catch (error) {
            console.error("Failed to load embedding model:", error);
        } finally {
            this.isLoading = false;
        }
    }

    public async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            await this.init();
            if (!this.pipe) return null;

            // Generate embedding
            const output = await this.pipe(text, { pooling: 'mean', normalize: true });

            // Convert Tensor to standard array
            return Array.from(output.data);
        } catch (e) {
            console.error("Error generating embedding:", e);
            return null;
        }
    }
}

export const embeddingService = EmbeddingService.getInstance();
