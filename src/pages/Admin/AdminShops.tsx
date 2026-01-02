import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Storefront, MapPin, Prohibit, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import Button from '../../components/Button';
import PaginationControls from '../../components/PaginationControls';

const PAGE_SIZE = 10;

const AdminShops = () => {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'suspended'>('pending');

    // Pagination & Search
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchShops = async () => {
        setLoading(true);
        try {
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('shops')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Filter by search
            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            // Client-side vs Server-side filtering note: 
            // Ideally we do this server-side, but 'status' checks are simple eq()
            // However, activeTab logic was "filter array after fetch" in previous code. 
            // To do pagination correctly, we MUST filter in the query.
            if (activeTab !== 'all') {
                query = query.eq('status', activeTab);
            }

            const { data, error, count } = await query;

            if (error) throw error;
            setShops(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, [activeTab, page]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (page === 1) fetchShops();
            else setPage(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleStatusUpdate = async (shopId: string, status: 'approved' | 'rejected' | 'suspended') => {
        const action = status === 'suspended' ? 'SUSPEND' : status.toUpperCase();
        if (!confirm(`Are you sure you want to ${action} this shop?`)) return;

        setProcessingId(shopId);
        try {
            const { data, error } = await supabase
                .from('shops')
                .update({ status })
                .eq('id', shopId)
                .select();

            if (error) throw error;

            if (data.length === 0) {
                alert('Action Failed: Permission Denied. Please Log Out and Log Back In.');
                return;
            }

            setShops(prev => prev.map(s => s.id === shopId ? { ...s, status } : s));

        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (shopId: string) => {
        if (!confirm('DANGER: This will permanently DELETE this shop and all its data.\n\nAre you sure?')) return;
        if (!confirm('Double Check: This action cannot be undone. Confirm deletion?')) return;

        setProcessingId(shopId);
        try {
            const { error } = await supabase.from('shops').delete().eq('id', shopId);
            if (error) throw error;

            setShops(prev => prev.filter(s => s.id !== shopId));
        } catch (error) {
            console.error(error);
            alert('Failed to delete shop. Check if it has related records (bookings/pets) that prevent deletion.');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '#059669' };
            case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: '#b91c1c' };
            case 'suspended': return { bg: 'rgba(241, 245, 249, 0.1)', text: '#94a3b8', border: '#475569' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: '#d97706' };
        }
    };

    const tabs = [
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'suspended', label: 'Suspended' },
        { id: 'all', label: 'All Shops' },
    ] as const;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>Manage Shops</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
                        <MagnifyingGlass
                            size={20}
                            color="#94a3b8"
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search shops..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2dd4bf'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                    </div>
                    <Button variant="outline" onClick={fetchShops} disabled={loading} style={{ borderColor: '#334155', color: '#94a3b8', background: '#1e293b' }}>Refresh</Button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === tab.id ? '#1e293b' : 'transparent',
                            border: '1px solid',
                            borderColor: activeTab === tab.id ? '#334155' : 'transparent',
                            borderBottomColor: activeTab === tab.id ? '#1e293b' : 'transparent',
                            borderRadius: '8px 8px 0 0',
                            fontWeight: 600,
                            color: activeTab === tab.id ? '#2dd4bf' : '#94a3b8',
                            cursor: 'pointer',
                            marginBottom: '-1px',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                        {tab.id === 'pending' && shops.filter(s => (s.status || 'pending') === 'pending').length > 0 && (
                            <span style={{
                                marginLeft: '0.5rem', background: '#ef4444', color: 'white',
                                fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '99px'
                            }}>
                                {shops.filter(s => (s.status || 'pending') === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8' }}>Loading shops...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {shops.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                            <Storefront size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No {activeTab === 'all' ? '' : activeTab} shops found.</p>
                        </div>
                    )}

                    {shops.map(shop => {
                        const statusColor = getStatusColor(shop.status || 'pending');
                        return (
                            <div key={shop.id} style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{
                                            width: '64px', height: '64px', borderRadius: '8px',
                                            background: shop.image_url ? `url(${shop.image_url}) center/cover` : '#334155',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '1px solid #475569'
                                        }}>
                                            {!shop.image_url && <Storefront size={32} color="#94a3b8" />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{shop.name}</h3>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                                <MapPin /> {shop.city}, {shop.state}
                                            </p>
                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}>
                                                    {(shop.status || 'pending').toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    Joined: {new Date(shop.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {/* Actions based on Status */}
                                        {shop.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(shop.id, 'approved')}
                                                    loading={processingId === shop.id}
                                                    disabled={!!processingId}
                                                    style={{ background: '#10b981', borderColor: '#10b981', color: 'white' }}
                                                >
                                                    <Check weight="bold" /> Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(shop.id, 'rejected')}
                                                    loading={processingId === shop.id}
                                                    disabled={!!processingId}
                                                    style={{ color: '#ef4444', borderColor: '#ef4444', background: 'transparent' }}
                                                >
                                                    <X weight="bold" /> Reject
                                                </Button>
                                            </>
                                        )}

                                        {shop.status === 'approved' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStatusUpdate(shop.id, 'suspended')}
                                                loading={processingId === shop.id}
                                                disabled={!!processingId}
                                                style={{ color: '#f59e0b', borderColor: '#f59e0b', background: 'transparent' }}
                                            >
                                                <Prohibit weight="bold" /> Suspend
                                            </Button>
                                        )}

                                        {shop.status === 'suspended' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleStatusUpdate(shop.id, 'approved')}
                                                loading={processingId === shop.id}
                                                disabled={!!processingId}
                                            >
                                                <Check weight="bold" /> Reactivate
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(shop.id)}
                                            loading={processingId === shop.id}
                                            disabled={!!processingId}
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <PaginationControls
                        currentPage={page}
                        totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                        onPageChange={setPage}
                        hasNext={page * PAGE_SIZE < totalCount}
                        hasPrev={page > 1}
                        loading={loading}
                        totalItems={totalCount}
                        style={{ marginTop: '1.5rem', color: '#94a3b8', background: 'transparent', borderTop: '1px solid #334155' }}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminShops;
