import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { embeddingService } from '../../lib/embeddingService';
import Button from '../../components/Button';
import { useToast } from '../../context/ToastContext';

const VectorBackfill = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState({ total: 0, processed: 0, pending: 0, failed: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));

    const fetchStats = async () => {
        try {
            const { count, error } = await supabase
                .from('pets')
                .select('*', { count: 'exact', head: true });

            // Note: Detecting "null" embedding might require a specific filter or just count all vs count with embedding
            // Since we can't easily count NULL vector in simple head request without logic, we'll rough it.
            // Actually, we can checking where embedding is null
            const { count: pendingCount } = await supabase
                .from('pets')
                .select('*', { count: 'exact', head: true })
                .is('embedding', null);

            if (error) throw error;

            setStats({
                total: count || 0,
                pending: pendingCount || 0,
                processed: (count || 0) - (pendingCount || 0),
                failed: 0
            });
        } catch (err: any) {
            console.error(err);
            addLog(`Error fetching stats: ${err.message}`);
        }
    };

    const processBackfill = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        addLog("Starting backfill process...");

        try {
            let hasMore = true;
            let processed = 0;
            let failures = 0;

            while (hasMore) {
                // Fetch batch of 10 pets without embeddings
                const { data: pets, error } = await supabase
                    .from('pets')
                    .select('id, name, breed, bio, traits')
                    .is('embedding', null)
                    .limit(10);

                if (error) throw error;
                if (!pets || pets.length === 0) {
                    hasMore = false;
                    break;
                }

                addLog(`Processing batch of ${pets.length} pets...`);

                for (const pet of pets) {
                    try {
                        const text = `${pet.breed || ''} ${pet.traits?.join(' ') || ''} ${pet.bio || ''}`.trim();
                        if (!text) {
                            addLog(`Skipping pet ${pet.id} (No text data)`);
                            continue;
                        }

                        const embedding = await embeddingService.generateEmbedding(text);
                        if (!embedding) {
                            throw new Error("Failed to generate embedding");
                        }

                        // Update Pet
                        const { error: updateError } = await supabase
                            .from('pets')
                            .update({ embedding }) // vector column auto-casts
                            .eq('id', pet.id);

                        if (updateError) throw updateError;
                        processed++;
                    } catch (e: any) {
                        console.error(e);
                        failures++;
                        addLog(`Failed to process pet ${pet.id}: ${e.message}`);
                    }
                }

                // Update UI stats
                setStats(prev => ({
                    ...prev,
                    processed: prev.processed + processed,
                    pending: Math.max(0, prev.pending - pets.length),
                    failed: prev.failed + failures
                }));

                // Safety break/pause
                await new Promise(r => setTimeout(r, 500));
            }

            addLog("Backfill complete!");
            showToast("Backfill process completed successfully", "success");

        } catch (err: any) {
            console.error(err);
            addLog(`Critical error: ${err.message}`);
            showToast("Backfill failed", "error");
        } finally {
            setIsProcessing(false);
            fetchStats(); // Final refresh
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Vector Embeddings Backfill</h1>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <div className="text-gray-500 text-sm">Total Pets</div>
                    <div className="text-3xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <div className="text-gray-500 text-sm">Pending Embeddings</div>
                    <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <div className="text-gray-500 text-sm">Processed</div>
                    <div className="text-3xl font-bold text-green-500">{stats.processed}</div>
                </div>
            </div>

            <div className="mb-8">
                <Button
                    onClick={processBackfill}
                    disabled={isProcessing || stats.pending === 0}
                    loading={isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Start Backfill Job'}
                </Button>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="opacity-50">System logs will appear here...</div>
                ) : (
                    logs.map((log, i) => <div key={i}>&gt; {log}</div>)
                )}
            </div>
        </div>
    );
};

export default VectorBackfill;
