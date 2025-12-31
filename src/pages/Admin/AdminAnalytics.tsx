import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChartBar, Eye, Clock } from '@phosphor-icons/react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        totalVisits: 0,
        totalPageViews: 0,
        avgSessionDuration: 0,
        topPages: [] as { path: string, count: number }[],
        eventsOverTime: [] as { time: string, count: number }[],
        eventDistribution: [] as { name: string, value: number }[],
        deviceDistribution: [] as { name: string, value: number }[]
    });
    const [loading, setLoading] = useState(true);

    const processData = (data: any[]) => {
        if (!data || data.length === 0) {
            setStats({
                totalVisits: 0,
                totalPageViews: 0,
                avgSessionDuration: 0,
                topPages: [],
                eventsOverTime: [],
                eventDistribution: [],
                deviceDistribution: []
            });
            return;
        }

        const sessions = new Set();
        let pageViews = 0;
        const pageCounts: Record<string, number> = {};
        const sessionStartTimes: Record<string, string> = {};
        const sessionEndTimes: Record<string, string> = {};
        const eventTypeCounts: Record<string, number> = {};
        const deviceCounts: Record<string, number> = {};
        const buckets: Record<string, number> = {}; // Hour buckets

        data.forEach((event: any) => {
            sessions.add(event.session_id);
            eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;

            if (event.event_type === 'page_view') {
                pageViews++;
                const path = event.payload?.path || 'unknown';
                pageCounts[path] = (pageCounts[path] || 0) + 1;
            }

            if (event.event_type === 'session_start' && event.payload?.device) {
                const device = event.payload.device; // 'mobile' or 'desktop'
                deviceCounts[device] = (deviceCounts[device] || 0) + 1;
            }

            // Track times
            if (!sessionStartTimes[event.session_id] || event.created_at < sessionStartTimes[event.session_id]) {
                sessionStartTimes[event.session_id] = event.created_at;
            }
            if (!sessionEndTimes[event.session_id] || event.created_at > sessionEndTimes[event.session_id]) {
                sessionEndTimes[event.session_id] = event.created_at;
            }

            // Time Buckets (Last 24h roughly, or just raw buckets)
            const date = new Date(event.created_at);
            const key = `${date.getHours()}:00`; // Simple hour bucket
            buckets[key] = (buckets[key] || 0) + 1;
        });

        // Calc Duration
        let totalDurationMs = 0;
        let durationCount = 0;
        sessions.forEach((sid: any) => {
            if (sessionStartTimes[sid] && sessionEndTimes[sid]) {
                const diff = new Date(sessionEndTimes[sid]).getTime() - new Date(sessionStartTimes[sid]).getTime();
                if (diff > 0 && diff < 86400000) {
                    totalDurationMs += diff;
                    durationCount++;
                }
            }
        });

        const avgDuration = durationCount > 0 ? totalDurationMs / durationCount : 0;

        // Top Pages
        const sortedPages = Object.entries(pageCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Event Distribution
        const eventDist = Object.entries(eventTypeCounts)
            .map(([name, value]) => ({ name, value }));

        // Device Distribution
        const deviceDist = Object.entries(deviceCounts)
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

        // Over Time (Sort by hour usually requires full date key, simplifying here for demo)
        // Ideally we fill gaps. For now, just map existing.
        // Better: map last 24h.
        const now = new Date();
        const last24h = Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            return `${d.getHours()}:00`;
        });

        const overTime = last24h.map(time => ({
            time,
            count: buckets[time] || 0
        }));


        setStats({
            totalVisits: sessions.size,
            totalPageViews: pageViews,
            avgSessionDuration: avgDuration,
            topPages: sortedPages,
            eventsOverTime: overTime,
            eventDistribution: eventDist,
            deviceDistribution: deviceDist
        });
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5000); // 5k events limit

            if (error) throw error;
            processData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();

        // Real-time subscription
        const channel = supabase
            .channel('analytics-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'analytics_events' },
                () => {
                    // Refresh data on new event (debounce ideally, but simple refetch works for now)
                    // Or smarter: append to local state. For accuracy, refetching mostly safe if not too frequent.
                    // Let's just refetch silently without loading spinner
                    supabase
                        .from('analytics_events')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(5000)
                        .then(({ data }) => {
                            if (data) processData(data);
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>
                    Analytics Dashboard
                    <span style={{ fontSize: '0.8rem', marginLeft: '1rem', background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '99px', verticalAlign: 'middle' }}>
                        ● Live
                    </span>
                </h1>
                <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>Refresh</Button>
            </div>

            {loading && stats.totalVisits === 0 ? (
                <div>Loading analytics...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                        <Card padding="lg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#dbeafe', padding: '0.75rem', borderRadius: '12px', color: '#1e40af' }}>
                                    <ChartBar size={32} weight="duotone" />
                                </div>
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Visits</p>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{stats.totalVisits.toLocaleString()}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card padding="lg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '12px', color: '#065f46' }}>
                                    <Eye size={32} weight="duotone" />
                                </div>
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Page Views</p>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{stats.totalPageViews.toLocaleString()}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card padding="lg">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '12px', color: '#92400e' }}>
                                    <Clock size={32} weight="duotone" />
                                </div>
                                <div>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Avg. Session</p>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{formatDuration(stats.avgSessionDuration)}</h3>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                        {/* Traffic Trend */}
                        <Card padding="lg">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Traffic (Last 24h)</h3>
                            <div style={{ height: '300px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.eventsOverTime}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="time" style={{ fontSize: '0.75rem' }} />
                                        <YAxis style={{ fontSize: '0.75rem' }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="count" stroke="#4F46E5" fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Top Pages Bar Chart */}
                        <Card padding="lg">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Top 5 Pages</h3>
                            <div style={{ height: '300px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.topPages} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" style={{ fontSize: '0.75rem' }} />
                                        <YAxis dataKey="path" type="category" width={100} style={{ fontSize: '0.75rem' }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Event Distribution Pie */}
                        <Card padding="lg">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Event Types</h3>
                            <div style={{ height: '250px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.eventDistribution}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.eventDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                    {stats.eventDistribution.map((entry, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Device Stats (If data available) */}
                        <Card padding="lg">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Sessions by Device</h3>
                            {stats.deviceDistribution.length > 0 ? (
                                <div style={{ height: '250px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.deviceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label
                                            >
                                                {stats.deviceDistribution.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#EAB308'} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                        Based on session_start events
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    Not enough data
                                </div>
                            )}
                        </Card>

                    </div>

                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;
