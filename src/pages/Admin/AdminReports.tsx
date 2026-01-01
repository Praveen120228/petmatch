import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Flag, User, Prohibit, PawPrint, EyeSlash } from '@phosphor-icons/react';
import Button from '../../components/Button';
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
                    reported:reported_id(id, name, email, status),
                    reported_pet:reported_pet_id(id, name, image, status)
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

    const handleHidePet = async (report: any) => {
        if (!confirm(`Are you sure you want to HIDE ${report.reported_pet?.name}?`)) return;
        setProcessingId(report.id);
        try {
            // 1. Update Pet Status
            const { error: petError } = await supabase
                .from('pets')
                .update({ status: 'hidden' })
                .eq('id', report.reported_pet_id);

            if (petError) throw petError;

            // 2. Mark report as resolved
            await handleUpdateStatus(report.id, 'resolved');

            alert(`Pet ${report.reported_pet?.name} has been HIDDEN.`);
            fetchReports();
        } catch (error) {
            console.error(error);
            alert("Failed to hide pet");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: '#b91c1c' };
            case 'resolved': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '#059669' };
            case 'dismissed': return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: '#475569' };
            default: return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: '#475569' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>User Reports</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                appearance: 'none',
                                padding: '0.6rem 2.5rem 0.6rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                cursor: 'pointer',
                                outline: 'none',
                                fontSize: '0.9rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                minWidth: '150px'
                            }}
                        >
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                            <option value="all">All Reports</option>
                        </select>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="#94a3b8"
                            viewBox="0 0 256 256"
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                        </svg>
                    </div>
                    <Button variant="outline" onClick={fetchReports} disabled={loading} style={{ borderColor: '#334155', color: '#94a3b8', background: '#1e293b' }}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8' }}>Loading reports...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reports.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                            <Flag size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No reports found.</p>
                        </div>
                    )}

                    {reports.map(report => {
                        const statusColor = getStatusColor(report.status);
                        return (
                            <div key={report.id} style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Flag weight="fill" />
                                                    {report.reason.toUpperCase()}
                                                </h3>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    Reported on {format(new Date(report.created_at), 'PPP p')}
                                                </span>
                                            </div>
                                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}>
                                                {report.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <p style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', color: '#e2e8f0', marginBottom: '1.5rem', border: '1px solid #334155' }}>
                                            "{report.description}"
                                        </p>

                                        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                                            {/* Logic to show Pet vs User report target */}
                                            {report.reported_pet ? (
                                                <div>
                                                    <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Reported Pet</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#cbd5e1' }}>
                                                        <PawPrint weight="fill" color="#c084fc" />
                                                        <span style={{ fontWeight: 600 }}>{report.reported_pet.name}</span>
                                                        {report.reported_pet.status === 'hidden' && <span style={{ background: '#d97706', color: 'white', fontSize: '0.7rem', padding: '1px 4px', borderRadius: '4px' }}>HIDDEN</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Owned by: {report.reported?.name}</div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Reported User</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#cbd5e1' }}>
                                                        <User weight="bold" />
                                                        <span style={{ fontWeight: 600 }}>{report.reported?.name || 'Unknown'}</span>
                                                        <span style={{ color: '#64748b' }}>({report.reported?.email})</span>
                                                        {report.reported?.status === 'banned' && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '1px 4px', borderRadius: '4px' }}>BANNED</span>}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Reporter</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#cbd5e1' }}>
                                                    <span style={{ fontWeight: 500 }}>{report.reporter?.name || 'Unknown'}</span>
                                                    <span style={{ color: '#64748b' }}>({report.reporter?.email})</span>
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
                                                    style={{ background: '#10b981', borderColor: '#10b981', color: '#0f172a' }}
                                                    disabled={!!processingId}
                                                >
                                                    <Check weight="bold" /> Resolve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                                    disabled={!!processingId}
                                                    style={{ borderColor: '#334155', color: '#94a3b8' }}
                                                >
                                                    <X weight="bold" /> Dismiss
                                                </Button>
                                                {report.reported_pet ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        style={{ color: '#fbbf24', borderColor: '#d97706' }}
                                                        onClick={() => handleHidePet(report)}
                                                        disabled={!!processingId}
                                                    >
                                                        <EyeSlash weight="bold" /> Hide Pet
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        style={{ color: '#f87171', borderColor: '#dc2626' }}
                                                        onClick={() => handleBanUser(report)}
                                                        disabled={!!processingId}
                                                    >
                                                        <Prohibit weight="bold" /> Ban User
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {report.status !== 'pending' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleUpdateStatus(report.id, 'pending')}
                                                disabled={!!processingId}
                                                style={{ color: '#94a3b8' }}
                                            >
                                                Reopen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminReports;
