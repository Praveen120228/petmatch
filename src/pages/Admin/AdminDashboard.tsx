import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Storefront, CalendarCheck, WarningCircle } from '@phosphor-icons/react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalShops: 0,
        pendingShops: 0,
        totalBookings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Parallel fetching of counts
                // Using head: true to get approximate count which is cheaper and faster, OR exact if needed.
                // Supabase .count()

                const [
                    { count: usersCount },
                    { count: shopsCount },
                    { count: pendingCount },
                    { count: bookingsCount }
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('shops').select('*', { count: 'exact', head: true }),
                    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('bookings').select('*', { count: 'exact', head: true })
                ]);

                setStats({
                    totalUsers: usersCount || 0,
                    totalShops: shopsCount || 0,
                    pendingShops: pendingCount || 0,
                    totalBookings: bookingsCount || 0
                });

            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { label: 'Total Users', value: stats.totalUsers, icon: <Users size={32} weight="duotone" color="#3b82f6" />, bg: '#eff6ff' },
        { label: 'Total Shops', value: stats.totalShops, icon: <Storefront size={32} weight="duotone" color="#10b981" />, bg: '#ecfdf5' },
        { label: 'Pending Approvals', value: stats.pendingShops, icon: <WarningCircle size={32} weight="duotone" color="#f59e0b" />, bg: '#fffbeb' },
        { label: 'Total Bookings', value: stats.totalBookings, icon: <CalendarCheck size={32} weight="duotone" color="#8b5cf6" />, bg: '#f5f3ff' },
    ];

    if (loading) return <div className="fade-in p-8">Loading stats...</div>;

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, i) => (
                    <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{card.label}</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Recent Activity or Charts Placeholder */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Analytics Overview</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Chart integration coming soon...
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>System Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 500 }}>Database Status</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 500 }}>Storage Status</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 500 }}>Auth Service</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
