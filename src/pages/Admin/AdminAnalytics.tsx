import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChartBar, Eye, Clock, MouseLeftClick } from '@phosphor-icons/react';
import Card from '../../components/Card';
import Button from '../../components/Button';

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        totalVisits: 0,
        totalPageViews: 0,
        avgSessionDuration: 0,
        topPages: [] as { path: string, count: number }[]
    });
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000); // Limit for performance

            if (error) throw error;

            if (!data || data.length === 0) {
                setStats({ totalVisits: 0, totalPageViews: 0, avgSessionDuration: 0, topPages: [] });
                return;
            }

            // Client-side aggregation (for MVP)
            const sessions = new Set();
            let pageViews = 0;
            const pageCounts: Record<string, number> = {};
            const sessionStartTimes: Record<string, string> = {};
            const sessionEndTimes: Record<string, string> = {};

            data.forEach((event: any) => {
                sessions.add(event.session_id);

                if (event.event_type === 'page_view') {
                    pageViews++;
                    const path = event.payload?.path || 'unknown';
                    pageCounts[path] = (pageCounts[path] || 0) + 1;
                }

                // Track times
                if (!sessionStartTimes[event.session_id] || event.created_at < sessionStartTimes[event.session_id]) {
                    sessionStartTimes[event.session_id] = event.created_at;
                }
                if (!sessionEndTimes[event.session_id] || event.created_at > sessionEndTimes[event.session_id]) {
                    sessionEndTimes[event.session_id] = event.created_at;
                }
            });

            // Calc Duration
            let totalDurationMs = 0;
            let durationCount = 0;
            sessions.forEach((sid: any) => {
                if (sessionStartTimes[sid] && sessionEndTimes[sid]) {
                    const diff = new Date(sessionEndTimes[sid]).getTime() - new Date(sessionStartTimes[sid]).getTime();
                    // unexpected huge outliers or single-event sessions (0ms)
                    if (diff > 0 && diff < 86400000) {
                        totalDurationMs += diff;
                        durationCount++;
                    }
                }
            });

            const avgDuration = durationCount > 0 ? totalDurationMs / durationCount : 0;

            // Format Top Pages
            const sortedPages = Object.entries(pageCounts)
                .map(([path, count]) => ({ path, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setStats({
                totalVisits: sessions.size,
                totalPageViews: pageViews,
                avgSessionDuration: avgDuration,
                topPages: sortedPages
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            alert('Failed to load analytics data. Ensure RLS policies are updated.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
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
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Analytics Dashboard</h1>
                <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>Refresh Data</Button>
            </div>

            {loading ? (
                <div>Loading analytics...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Key Metrics Grid */}
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
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total Page Views</p>
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
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Avg. Session Time</p>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{formatDuration(stats.avgSessionDuration)}</h3>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts / Lists */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                        {/* Top Pages List */}
                        <Card padding="lg">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MouseLeftClick size={24} color="#64748b" /> Top Pages
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {stats.topPages.length === 0 ? (
                                    <p style={{ color: '#94a3b8' }}>No page view data available.</p>
                                ) : (
                                    stats.topPages.map((page, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: index % 2 === 0 ? '#f8fafc' : 'white',
                                            borderRadius: '8px'
                                        }}>
                                            <span style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                {page.path}
                                            </span>
                                            <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                                                {page.count} views
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                    </div>

                    {/* Note */}
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
                        * Analytics data is aggregated client-side from the last 10,000 events. For robust analytics at scale, consider aggregated materialized views.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;
