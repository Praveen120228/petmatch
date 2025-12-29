import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { CalendarCheck, Users, TrendUp, Clock } from '@phosphor-icons/react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';

const ShopDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayBookings: 0,
        pendingRequests: 0,
        totalServices: 0
    });
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!user) return;
            try {
                // 1. Get Shop Details
                const { data: shopData } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('owner_id', user.id)
                    .single();

                if (shopData) {
                    setShop(shopData);

                    // 2. Mock Stats/Get Stats (We assume bookings table is getting populated)
                    // For now, simple count queries if tables exist
                    const { count: pendingCount } = await supabase
                        .from('bookings')
                        .select('id', { count: 'exact', head: true })
                        .eq('shop_id', shopData.id)
                        .eq('status', 'pending');

                    setStats(prev => ({ ...prev, pendingRequests: pendingCount || 0 }));

                } else {
                    // No Shop yet? Redirect to create shop or show prompts
                }

                // Mock stats for demo if empty
                if (!shopData) setStats({ todayBookings: 0, pendingRequests: 0, totalServices: 0 });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [user]);

    if (loading) return <div>Loading dashboard...</div>;

    if (!shop) {
        return (
            <div className="fade-in">
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome, {user?.name}!</h1>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.1rem' }}>You haven't set up your shop profile yet.</p>
                    <Link to="/shop/services">
                        <Button variant="primary" size="lg">Create Shop Profile</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Today\'s Bookings', value: stats.todayBookings, icon: <CalendarCheck size={24} color="#4f46e5" />, bg: '#eef2ff' },
        { label: 'Pending Requests', value: stats.pendingRequests, icon: <Clock size={24} color="#ea580c" />, bg: '#ffedd5' },
        { label: 'Active Services', value: stats.totalServices, icon: <Users size={24} color="#10b981" />, bg: '#d1fae5' },
        { label: 'Total Revenue', value: '$0.00', icon: <TrendUp size={24} color="#2563eb" />, bg: '#dbeafe' },
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Dashboard</h1>
                <p style={{ color: '#64748b' }}>Welcome back to {shop.name}</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {statCards.map((stat, i) => (
                    <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: stat.bg }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Activity</h3>
                    <Link to="/shop/bookings" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>View All</Link>
                </div>

                {stats.pendingRequests === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        No recent bookings or activity.
                    </div>
                ) : (
                    <div>
                        {/* List would go here */}
                        <p>You have new booking requests to review.</p>
                        <Link to="/shop/bookings">
                            <Button size="sm" variant="outline">Review Bookings</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopDashboard;
