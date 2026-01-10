import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, User, Prohibit, Trash, MagnifyingGlass, DotsThree, CaretUp, CaretDown } from '@phosphor-icons/react';
import Button from '../../components/Button';
import PaginationControls from '../../components/PaginationControls';

const PAGE_SIZE = 10;
type FilterRole = 'all' | 'user' | 'shop_owner' | 'admin';

const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filterRole, setFilterRole] = useState<FilterRole>('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);


    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Calculate range
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: sortOrder === 'asc' })
                .range(from, to);

            if (filterRole !== 'all') {
                query = query.eq('role', filterRole);
            }

            if (search) {
                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;
            setUsers(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, page, filterRole, sortOrder]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, filterRole]);

    const handleStatusUpdate = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
        if (!confirm(`Are you sure you want to set this user to ${status.toUpperCase()}?`)) return;

        setProcessingId(userId);
        try {
            // NOTE: We rely on RLS policy on 'profiles' table.
            const { data, error } = await supabase
                .from('profiles')
                .update({ status })
                .eq('id', userId)
                .select();

            if (error) throw error;

            if (data.length === 0) {
                alert('Action Failed: Permission Denied or User Not Found.');
                return;
            }

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('DANGER: This will delete the user profile. Supabase Auth user might remain unless deleted via Edge Function.\n\nAre you sure?')) return;

        setProcessingId(userId);
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error(error);
            alert('Failed to delete user.');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '#059669' };
            case 'suspended': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: '#d97706' };
            case 'banned': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: '#b91c1c' };
            default: return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: '#475569' };
        }
    };

    const tabs: { id: FilterRole; label: string }[] = [
        { id: 'all', label: 'All Users' },
        { id: 'user', label: 'Regular Users' },
        { id: 'shop_owner', label: 'Shop Owners' },
        { id: 'admin', label: 'Admins' }
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>Manage Users</h1>
            </div>

            {/* Filter Tabs & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '0.25rem', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterRole(tab.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                background: filterRole === tab.id ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
                                color: filterRole === tab.id ? '#2dd4bf' : '#94a3b8',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <MagnifyingGlass
                            size={20}
                            color="#94a3b8"
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                fontSize: '0.9rem',
                                color: 'white',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2dd4bf'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                    </div>
                    <Button variant="outline" onClick={fetchUsers} disabled={loading} style={{ borderColor: '#334155', color: '#94a3b8', background: '#1e293b' }}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8' }}>Loading users...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* Wrap list in a nice border container */}
                    <div style={{ border: '1px solid #334155', borderRadius: '12px', overflowX: 'auto', background: '#1e293b', maxWidth: '100%', width: '100%', WebkitOverflowScrolling: 'touch' }}>

                        {/* Table Header Row (Simulated) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr 1fr 0.8fr 100px', padding: '1rem 1.5rem', background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '900px' }}>
                            <div>User</div>
                            <div>Email</div>
                            <div>Role</div>
                            <div
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}
                                title="Click to sort by date"
                            >
                                Joined
                                {sortOrder === 'asc' ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                            </div>
                            <div>Status</div>
                            <div style={{ textAlign: 'right' }}>Actions</div>
                        </div>

                        {users.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#1e293b', color: '#94a3b8' }}>
                                <p>No users found matching filters.</p>
                            </div>
                        )}

                        {users.map((u, index) => {
                            const statusColor = getStatusColor(u.status || 'active');
                            const isLast = index === users.length - 1;
                            return (
                                <div key={u.id} style={{
                                    padding: '1rem 1.5rem',
                                    background: '#1e293b',
                                    borderBottom: isLast ? 'none' : '1px solid #334155',
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1.5fr 0.8fr 1fr 0.8fr 100px',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    minWidth: '900px'
                                }}>
                                    {/* User Column */}
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : '#334155',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '1px solid #475569'
                                        }}>
                                            {!u.avatar_url && <User size={20} color="#94a3b8" />}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                {u.name || 'Unnamed User'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email Column */}
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{u.email}</p>
                                    </div>

                                    {/* Role Column */}
                                    <div>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            color: '#cbd5e1',
                                            background: '#334155',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px'
                                        }}>
                                            {u.role}
                                        </span>
                                    </div>

                                    {/* Joined Column */}
                                    <div>
                                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : (u.updated_at ? `Updated: ${new Date(u.updated_at).toLocaleDateString()}` : 'N/A')}
                                        </p>
                                    </div>

                                    {/* Status Column */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor.border }}></div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: statusColor.text }}>
                                                {(u.status || 'active').charAt(0).toUpperCase() + (u.status || 'active').slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions Column */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => { /* Open Dropdown or something, for now just buttons */ }}
                                                style={{ color: '#94a3b8', padding: '0.25rem' }}
                                            >
                                                <DotsThree size={24} weight="bold" />
                                            </Button>
                                            {/* Hidden hover menu logic implies complexity, simplify to just inline buttons if space permits or modal */}
                                        </div>

                                        {/* Simplified Actions for this view */}
                                        {(u.status || 'active') === 'active' && (
                                            <button
                                                onClick={() => handleStatusUpdate(u.id, 'suspended')}
                                                disabled={!!processingId}
                                                title="Suspend User"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fbbf24' }}
                                            >
                                                <Prohibit size={20} />
                                            </button>
                                        )}
                                        {(u.status === 'suspended' || u.status === 'banned') && (
                                            <button
                                                onClick={() => handleStatusUpdate(u.id, 'active')}
                                                disabled={!!processingId}
                                                title="Activate User"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}
                                            >
                                                <Check size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            disabled={!!processingId}
                                            title="Delete User"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        >
                                            <Trash size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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

export default AdminUsers;
