import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { CalendarCheck, Users, TrendUp, Clock, Storefront } from '@phosphor-icons/react';
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
                    const { count: pendingCount } = await supabase
                        .from('bookings')
                        .select('id', { count: 'exact', head: true })
                        .eq('shop_id', shopData.id)
                        .eq('status', 'pending');

                    setStats(prev => ({ ...prev, pendingRequests: pendingCount || 0 }));

                } else {
                    // No Shop yet? Redirect to create shop or show prompts
                }

                if (!shopData) setStats({ todayBookings: 0, pendingRequests: 0, totalServices: 0 });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [user]);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-500)' }}>
            <div className="pulse-animation" style={{ fontSize: '1.2rem' }}>Loading dashboard...</div>
        </div>
    );

    if (!shop) {
        return (
            <div className="fade-in">
                <div className="glass-panel" style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    borderRadius: '24px',
                    maxWidth: '600px',
                    margin: '4rem auto'
                }}>
                    <div style={{
                        margin: '0 auto 1.5rem',
                        height: '80px',
                        width: '80px',
                        borderRadius: '50%',
                        background: 'var(--primary-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Storefront size={40} color="var(--primary-500)" weight="duotone" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--gray-900)' }}>Welcome, {user?.name}!</h1>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
                        You haven't set up your shop profile yet. Create a profile to start accepting bookings and managing your services.
                    </p>
                    <Link to="/shop/services">
                        <Button variant="primary" size="lg">Create Shop Profile</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Today\'s Bookings', value: stats.todayBookings, icon: <CalendarCheck size={24} color="var(--primary-600)" weight="duotone" />, borderInfo: '4px solid var(--primary-400)' },
        { label: 'Pending Requests', value: stats.pendingRequests, icon: <Clock size={24} color="#ea580c" weight="duotone" />, borderInfo: '4px solid #f97316' },
        { label: 'Active Services', value: stats.totalServices, icon: <Users size={24} color="#10b981" weight="duotone" />, borderInfo: '4px solid #34d399' },
        { label: 'Total Revenue', value: '$0.00', icon: <TrendUp size={24} color="#2563eb" weight="duotone" />, borderInfo: '4px solid #60a5fa' },
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem' }}>Welcome back to <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{shop.name}</span></p>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-600)', border: '1px solid var(--gray-200)' }}>
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {statCards.map((stat, i) => (
                    <div key={i} className="glass-panel card-hover" style={{
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        borderBottom: stat.borderInfo,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '1rem',
                            borderRadius: '16px',
                            background: 'var(--primary-50)',
                            height: '56px',
                            width: '56px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1 }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)' }}>Recent Activity</h3>
                    <Link to="/shop/bookings" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>View All &rarr;</Link>
                </div>

                {stats.pendingRequests === 0 ? (
                    <div style={{
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.4)',
                        borderRadius: '16px',
                        border: '2px dashed var(--gray-200)'
                    }}>
                        <div style={{ marginBottom: '1rem', display: 'inline-flex', padding: '1rem', background: 'var(--gray-50)', borderRadius: '50%' }}>
                            <CalendarCheck size={32} color="var(--gray-400)" weight="duotone" />
                        </div>
                        <p style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: '1.1rem' }}>No recent bookings or activity.</p>
                        <p style={{ fontSize: '0.95rem', marginTop: '0.5rem', color: 'var(--gray-500)' }}>New requests will appear here instantly.</p>
                    </div>
                ) : (
                    <div>
                        {/* List would go here */}
                        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-600)' }}>You have {stats.pendingRequests} new booking requests to review.</p>
                        <div style={{ textAlign: 'center' }}>
                            <Link to="/shop/bookings">
                                <Button size="sm" variant="primary">Review Bookings</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopDashboard;
