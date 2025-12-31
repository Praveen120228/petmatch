import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Flag, User, Prohibit } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { format } from 'date-fns';

const AdminReports = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Join reporter and reported profiles
            let query = supabase
                .from('reports')
                .select(`
                    *,
                    reporter:reporter_id(name, email),
                    reported:reported_id(id, name, email, status)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const handleUpdateStatus = async (id: number, status: string) => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleBanUser = async (report: any) => {
        if (!confirm(`Are you sure you want to BAN ${report.reported?.name}?`)) return;
        setProcessingId(report.id);
        try {
            // 1. Update Profile Status
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ status: 'banned' })
                .eq('id', report.reported_id);

            if (profileError) throw profileError;

            // 2. Mark report as resolved
            await handleUpdateStatus(report.id, 'resolved');

            alert(`User ${report.reported?.name} has been BANNED.`);
            fetchReports(); // Refresh to show updated statuses
        } catch (error) {
            console.error(error);
            alert("Failed to ban user");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: '#fee2e2', text: '#ef4444' };
            case 'resolved': return { bg: '#dcfce7', text: '#166534' };
            case 'dismissed': return { bg: '#f1f5f9', text: '#64748b' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>User Reports</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#1e293b',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                        <option value="all">All Reports</option>
                    </select>
                    <Button variant="outline" onClick={fetchReports} disabled={loading}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div>Loading reports...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reports.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px' }}>
                            <Flag size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No reports found.</p>
                        </div>
                    )}

                    {reports.map(report => {
                        const statusColor = getStatusColor(report.status);
                        return (
                            <Card key={report.id} padding="lg">
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Flag weight="fill" />
                                                    {report.reason.toUpperCase()}
                                                </h3>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    Reported on {format(new Date(report.created_at), 'PPP p')}
                                                </span>
                                            </div>
                                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: statusColor.bg, color: statusColor.text }}>
                                                {report.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <p style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', color: '#334155', marginBottom: '1.5rem', border: '1px solid #f1f5f9' }}>
                                            "{report.description}"
                                        </p>

                                        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                                            <div>
                                                <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Reported User</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    <User weight="bold" />
                                                    <span style={{ fontWeight: 600 }}>{report.reported?.name || 'Unknown'}</span>
                                                    <span style={{ color: '#94a3b8' }}>({report.reported?.email})</span>
                                                    {report.reported?.status === 'banned' && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '1px 4px', borderRadius: '4px' }}>BANNED</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Reporter</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    <span style={{ fontWeight: 500 }}>{report.reporter?.name || 'Unknown'}</span>
                                                    <span style={{ color: '#94a3b8' }}>({report.reporter?.email})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                                        {report.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                                    style={{ background: '#10b981', borderColor: '#10b981' }}
                                                    disabled={!!processingId}
                                                >
                                                    <Check weight="bold" /> Resolve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                                    disabled={!!processingId}
                                                >
                                                    <X weight="bold" /> Dismiss
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    style={{ color: '#dc2626', borderColor: '#fee2e2' }}
                                                    onClick={() => handleBanUser(report)}
                                                    disabled={!!processingId}
                                                >
                                                    <Prohibit weight="bold" /> Ban User
                                                </Button>
                                            </>
                                        )}
                                        {report.status !== 'pending' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleUpdateStatus(report.id, 'pending')}
                                                disabled={!!processingId}
                                            >
                                                Reopen
                                            </Button>
                                        )}
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

export default AdminReports;
