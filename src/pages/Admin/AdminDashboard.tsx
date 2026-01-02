import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Storefront, CalendarCheck, WarningCircle } from '@phosphor-icons/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfDay, subDays, format } from 'date-fns';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalShops: 0,
        pendingShops: 0,
        totalBookings: 0,
        regularUsers: 0,
        shopOwners: 0,
        admins: 0
    });
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Fetch Counts
                const [
                    { count: usersCount },
                    { count: shopsCount },
                    { count: pendingCount },
                    { count: bookingsCount },
                    { count: regularUsersCount },
                    { count: shopOwnersCount },
                    { count: adminsCount }
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('shops').select('*', { count: 'exact', head: true }),
                    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('bookings').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'shop_owner'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
                ]);

                setStats({
                    totalUsers: usersCount || 0,
                    totalShops: shopsCount || 0,
                    pendingShops: pendingCount || 0,
                    totalBookings: bookingsCount || 0,
                    regularUsers: regularUsersCount || 0,
                    shopOwners: shopOwnersCount || 0,
                    admins: adminsCount || 0
                });

                // 2. Fetch Traffic Data (Last 7 Days) for the chart
                const now = new Date();
                const startDate = startOfDay(subDays(now, 6)); // 7 days including today

                const { data: events } = await supabase
                    .from('analytics_events')
                    .select('created_at')
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: true });

                if (events) {
                    const dailyCounts: Record<string, number> = {};
                    // Initialize last 7 days with 0
                    for (let i = 0; i < 7; i++) {
                        const dateStr = format(subDays(now, i), 'MM/dd');
                        dailyCounts[dateStr] = 0;
                    }

                    // Aggregate
                    events.forEach(event => {
                        const dateStr = format(new Date(event.created_at), 'MM/dd');
                        if (dailyCounts.hasOwnProperty(dateStr)) {
                            dailyCounts[dateStr]++;
                        }
                    });

                    // Better approach: Init array chronologically
                    const chronologicalData = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = subDays(now, i);
                        const key = format(d, 'MM/dd');
                        // Count occurrences in events
                        const count = events.filter(e => format(new Date(e.created_at), 'MM/dd') === key).length;
                        chronologicalData.push({ date: key, count });
                    }

                    setTrafficData(chronologicalData);
                }

            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: <Users size={32} weight="duotone" color="rgba(255,255,255,0.8)" />,
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #2dd4bf 100%)' // Teal/Cyan
        },
        {
            label: 'Active Shops',
            value: stats.totalShops,
            icon: <Storefront size={32} weight="duotone" color="rgba(255,255,255,0.8)" />,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' // Blue/Purple
        },
        {
            label: 'Pending Approvals',
            value: stats.pendingShops,
            icon: <WarningCircle size={32} weight="duotone" color="rgba(255,255,255,0.8)" />,
            gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' // Orange/Amber
        },
        {
            label: 'Total Bookings',
            value: stats.totalBookings,
            icon: <CalendarCheck size={32} weight="duotone" color="rgba(255,255,255,0.8)" />,
            gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' // Pink/Rose
        },
    ];

    const pieData = [
        { name: 'Regular Users', value: stats.regularUsers, color: '#3b82f6' },
        { name: 'Shop Owners', value: stats.shopOwners, color: '#10b981' },
        { name: 'Admins', value: stats.admins, color: '#8b5cf6' }
    ].filter(d => d.value > 0);

    if (loading) return <div className="fade-in p-8 text-white">Loading stats...</div>;

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, i) => (
                    <div key={i} style={{
                        background: card.gradient,
                        padding: '1.5rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 600 }}>{card.label}</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Traffic Chart */}
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', minHeight: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Analytics Overview</h3>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#334155', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #475569' }}>Last 7 Days</span>
                    </div>

                    <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: '#94a3b8' }} tickMargin={10} />
                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', color: 'white' }}
                                    cursor={{ stroke: '#2dd4bf', strokeWidth: 1 }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Distribution */}
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', minHeight: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'white' }}>User Distribution</h3>
                    <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
