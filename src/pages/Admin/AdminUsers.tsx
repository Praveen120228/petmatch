import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, User, Prohibit, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';

const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (search) {
                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setUsers(data || []);
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
    }, [search]);

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
            case 'active': return { bg: '#dcfce7', text: '#166534' };
            case 'suspended': return { bg: '#fef3c7', text: '#92400e' };
            case 'banned': return { bg: '#fee2e2', text: '#991b1b' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Manage Users</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
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
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <Button variant="outline" onClick={fetchUsers} disabled={loading}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div>Loading users...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {users.length === 0 && <p>No users found.</p>}

                    {users.map(u => {
                        const statusColor = getStatusColor(u.status || 'active');
                        return (
                            <Card key={u.id} padding="lg">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>

                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '50%',
                                            background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : '#e2e8f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {!u.avatar_url && <User size={24} color="#64748b" />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {u.name || 'Unnamed User'}
                                                <span style={{ fontSize: '0.7rem', fontWeight: 500, padding: '0.1rem 0.5rem', borderRadius: '99px', background: statusColor.bg, color: statusColor.text }}>
                                                    {(u.status || 'active').toUpperCase()}
                                                </span>
                                            </h3>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{u.email}</p>
                                            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Role: {u.role}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {(u.status || 'active') === 'active' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(u.id, 'suspended')}
                                                    loading={processingId === u.id}
                                                    disabled={!!processingId}
                                                    style={{ color: '#d97706', borderColor: '#d97706' }}
                                                >
                                                    <Prohibit /> Suspend
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(u.id, 'banned')}
                                                    loading={processingId === u.id}
                                                    disabled={!!processingId}
                                                    style={{ color: '#dc2626', borderColor: '#dc2626' }}
                                                >
                                                    <X /> Ban
                                                </Button>
                                            </>
                                        )}

                                        {(u.status === 'suspended' || u.status === 'banned') && (
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => handleStatusUpdate(u.id, 'active')}
                                                loading={processingId === u.id}
                                                disabled={!!processingId}
                                            >
                                                <Check /> Activate
                                            </Button>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(u.id)}
                                            disabled={!!processingId}
                                            style={{ color: '#94a3b8' }}
                                        >
                                            <Trash size={18} />
                                        </Button>
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

export default AdminUsers;
