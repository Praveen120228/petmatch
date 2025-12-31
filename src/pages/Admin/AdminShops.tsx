import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Storefront, MapPin } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';

const AdminShops = () => {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchShops = async () => {
        setLoading(true);
        try {
            // Fetch all pending shops first, then approved/rejected maybe?
            // For now, let's just fetch pending to streamline the workflow
            const { data, error } = await supabase
                .from('shops')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setShops(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleStatusUpdate = async (shopId: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this shop?`)) return;

        setProcessingId(shopId);
        try {
            const { error } = await supabase
                .from('shops')
                .update({ status })
                .eq('id', shopId);

            if (error) throw error;

            // Update local state
            setShops(prev => prev.map(s => s.id === shopId ? { ...s, status } : s));

        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return { bg: '#dcfce7', text: '#166534' };
            case 'rejected': return { bg: '#fee2e2', text: '#991b1b' };
            default: return { bg: '#fef3c7', text: '#92400e' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Manage Shops</h1>
                <Button variant="outline" onClick={fetchShops} disabled={loading}>Refresh</Button>
            </div>

            {loading ? (
                <div>Loading shops...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {shops.length === 0 && <p>No shops found.</p>}

                    {shops.map(shop => {
                        const statusColor = getStatusColor(shop.status || 'pending');
                        return (
                            <Card key={shop.id} padding="lg">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{
                                            width: '64px', height: '64px', borderRadius: '8px',
                                            background: shop.image_url ? `url(${shop.image_url}) center/cover` : '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {!shop.image_url && <Storefront size={32} color="#cbd5e1" />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{shop.name}</h3>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                                <MapPin /> {shop.city}, {shop.state}
                                            </p>
                                            <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: statusColor.bg, color: statusColor.text }}>
                                                {(shop.status || 'pending').toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {shop.status !== 'approved' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleStatusUpdate(shop.id, 'approved')}
                                                loading={processingId === shop.id}
                                                disabled={!!processingId}
                                                style={{ background: '#10b981', borderColor: '#10b981' }}
                                            >
                                                <Check weight="bold" /> Approve
                                            </Button>
                                        )}
                                        {shop.status !== 'rejected' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStatusUpdate(shop.id, 'rejected')}
                                                loading={processingId === shop.id}
                                                disabled={!!processingId}
                                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                            >
                                                <X weight="bold" /> Reject
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminShops;
