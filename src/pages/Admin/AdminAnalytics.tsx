import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChartBar, Eye, Clock, ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react';
import { startOfDay, subDays, format } from 'date-fns';
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

type TimeRange = '24h' | '7d' | '30d' | 'all';

const AdminAnalytics = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [stats, setStats] = useState({
        totalVisits: 0,
        totalPageViews: 0,
        avgSessionDuration: 0,
        topPages: [] as { path: string, count: number }[],
        eventsOverTime: [] as { time: string, count: number }[],
        eventDistribution: [] as { name: string, value: number }[],
        deviceDistribution: [] as { name: string, value: number }[],
        // Comparison Stats
        prevTotalVisits: 0,
        prevTotalPageViews: 0
    });
    const [loading, setLoading] = useState(true);

    const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const processData = (currentData: any[], previousData: any[]) => {
        // --- Process Current Period ---
        const sessions = new Set();
        let pageViews = 0;
        const pageCounts: Record<string, number> = {};
        const sessionStartTimes: Record<string, string> = {};
        const sessionEndTimes: Record<string, string> = {};
        const eventTypeCounts: Record<string, number> = {};
        const deviceCounts: Record<string, number> = {};
        const buckets: Record<string, number> = {};

        currentData.forEach((event: any) => {
            sessions.add(event.session_id);
            eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;

            if (event.event_type === 'page_view') {
                pageViews++;
                const path = event.payload?.path || 'unknown';
                pageCounts[path] = (pageCounts[path] || 0) + 1;
            }

            if (event.payload?.device) {
                const device = event.payload.device;
                deviceCounts[device] = (deviceCounts[device] || 0) + 1;
            }

            // Track times
            if (!sessionStartTimes[event.session_id] || event.created_at < sessionStartTimes[event.session_id]) {
                sessionStartTimes[event.session_id] = event.created_at;
            }
            if (!sessionEndTimes[event.session_id] || event.created_at > sessionEndTimes[event.session_id]) {
                sessionEndTimes[event.session_id] = event.created_at;
            }

            // Bucketing (Time-based aggregation)
            const date = new Date(event.created_at);
            let key = '';
            if (timeRange === '24h') {
                key = `${date.getHours()}:00`;
            } else {
                key = format(date, 'MM/dd');
            }
            buckets[key] = (buckets[key] || 0) + 1;
        });

        // --- Process Previous Period (Just counts for comparison) ---
        const prevSessions = new Set();
        let prevPageViews = 0;
        previousData.forEach((event: any) => {
            prevSessions.add(event.session_id);
            if (event.event_type === 'page_view') prevPageViews++;
        });

        // --- derived stats ---
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

        const sortedPages = Object.entries(pageCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const eventDist = Object.entries(eventTypeCounts)
            .map(([name, value]) => ({ name, value }));

        const deviceDist = Object.entries(deviceCounts)
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

        const overTime = Object.entries(buckets).map(([time, count]) => ({ time, count }));

        setStats({
            totalVisits: sessions.size,
            totalPageViews: pageViews,
            avgSessionDuration: avgDuration,
            topPages: sortedPages,
            eventsOverTime: overTime,
            eventDistribution: eventDist,
            deviceDistribution: deviceDist,
            prevTotalVisits: prevSessions.size,
            prevTotalPageViews: prevPageViews
        });
    };

    const fetchAnalytics = async () => {
        setLoading(true);

        // Calculate Date Ranges
        const now = new Date();
        let startDate = startOfDay(now);
        let prevDate = startOfDay(subDays(now, 1));

        if (timeRange === '24h') {
            startDate = subDays(now, 1);
            prevDate = subDays(now, 2);
        } else if (timeRange === '7d') {
            startDate = subDays(now, 7);
            prevDate = subDays(now, 14);
        } else if (timeRange === '30d') {
            startDate = subDays(now, 30);
            prevDate = subDays(now, 60);
        } else if (timeRange === 'all') {
            startDate = new Date(0);
            prevDate = new Date(0);
        }

        try {
            // Fetch Current Period
            const { data: currentData, error: currentError } = await supabase
                .from('analytics_events')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true })
                .limit(10000);

            if (currentError) throw currentError;

            // Fetch Previous Period (Only if not 'all')
            let previousData: any[] = [];
            if (timeRange !== 'all') {
                const { data: prev, error: prevError } = await supabase
                    .from('analytics_events')
                    .select('session_id, event_type')
                    .gte('created_at', prevDate.toISOString())
                    .lt('created_at', startDate.toISOString())
                    .limit(10000);

                if (!prevError && prev) previousData = prev;
            }

            processData(currentData || [], previousData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const channel = supabase
            .channel('analytics-realtime-v2')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'analytics_events' },
                () => {
                    setTimeout(fetchAnalytics, 1000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [timeRange]);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };

    const renderMetricChange = (current: number, prev: number) => {
        if (timeRange === 'all') return null;
        const change = calculatePercentageChange(current, prev);
        const isPositive = change >= 0;
        const color = isPositive ? '#34d399' : '#f87171';
        const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color, marginTop: '0.5rem', background: isPositive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px', alignSelf: 'flex-start' }}>
                <Icon weight="bold" />
                <span>{Math.abs(change)}% vs prev</span>
            </div>
        );
    };

    return (
        <div className="fade-in">
            {/* Header & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            Analytics
                            <span style={{ fontSize: '0.8rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 600 }}>
                                ● Live
                            </span>
                        </h1>
                        <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>Track your platform's performance and usage</p>
                    </div>

                    <div style={{ display: 'flex', background: '#1e293b', padding: '0.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
                        {(['24h', '7d', '30d', 'all'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: timeRange === r ? '#334155' : 'transparent',
                                    color: timeRange === r ? 'white' : '#94a3b8',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {r === '24h' ? 'Last 24h' : r === 'all' ? 'All Time' : `Last ${r.replace('d', ' Days')}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading && stats.totalVisits === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading analytics data...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#60a5fa' }}>
                                        <ChartBar size={32} weight="duotone" />
                                    </div>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Visits</p>
                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>{stats.totalVisits.toLocaleString()}</h3>
                                    </div>
                                </div>
                                {renderMetricChange(stats.totalVisits, stats.prevTotalVisits)}
                            </div>
                        </div>

                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#34d399' }}>
                                        <Eye size={32} weight="duotone" />
                                    </div>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Page Views</p>
                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>{stats.totalPageViews.toLocaleString()}</h3>
                                    </div>
                                </div>
                                {renderMetricChange(stats.totalPageViews, stats.prevTotalPageViews)}
                            </div>
                        </div>

                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#fbbf24' }}>
                                    <Clock size={32} weight="duotone" />
                                </div>
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Avg. Session Duration</p>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>{formatDuration(stats.avgSessionDuration)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                        {/* Traffic Trend */}
                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>
                                    Traffic Trend
                                    <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem' }}>
                                        ({timeRange === '24h' ? 'Last 24 Hours' : 'Visits over time'})
                                    </span>
                                </h3>
                            </div>
                            <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.eventsOverTime}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="time" style={{ fontSize: '0.75rem', fill: '#94a3b8' }} tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis style={{ fontSize: '0.75rem', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', background: '#334155', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)' }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Pages */}
                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Top Popular Pages</h3>
                            <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.topPages} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                                        <XAxis type="number" style={{ fontSize: '0.75rem', fill: '#94a3b8' }} hide />
                                        <YAxis dataKey="path" type="category" width={110} style={{ fontSize: '0.75rem', fontWeight: 500, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ borderRadius: '8px', border: 'none', background: '#334155', color: 'white' }} />
                                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24}>
                                            {stats.topPages.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#94a3b8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Device Distribution */}
                        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Sessions by Device</h3>
                            {stats.deviceDistribution.length > 0 ? (
                                <div style={{ height: '250px', width: '100%', position: 'relative', minWidth: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.deviceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats.deviceDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.name === 'Mobile' ? '#F59E0B' : '#6366F1'} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: '#334155', color: 'white' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Legend */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                                        {stats.deviceDistribution.map((entry, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.name === 'Mobile' ? '#F59E0B' : '#6366F1' }} />
                                                <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{entry.name}: {entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#0f172a', borderRadius: '12px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p>No device data specifically recorded yet.</p>
                                        <p style={{ fontSize: '0.8rem' }}>Visit pages to populate.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;
