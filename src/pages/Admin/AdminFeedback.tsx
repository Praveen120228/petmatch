import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { EnvelopeSimple, Trash, Star, CheckCircle } from '@phosphor-icons/react';

const AdminFeedback = () => {
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            // Join with profiles to get user email and name
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    profiles:user_id (email, name, role)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFeedback(data || []);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReviewed = async (id: number) => {
        try {
            const { error } = await supabase
                .from('feedback')
                .update({ status: 'reviewed' })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: 'reviewed' } : f));
        } catch (error) {
            console.error('Error marking feedback reviewed:', error);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        try {
            const { error } = await supabase
                .from('feedback')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setFeedback(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting feedback:', error);
            alert('Failed to delete');
        }
    };

    const filteredFeedback = feedback.filter(f => {
        if (filter === 'all') return true;
        return (f.status || 'pending') === filter;
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>Feedback & Suggestions</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['all', 'pending', 'reviewed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: filter === f ? '2px solid var(--primary-600)' : '1px solid #cbd5e1',
                                background: filter === f ? 'var(--primary-50)' : 'white',
                                color: filter === f ? 'var(--primary-700)' : '#64748b',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                cursor: 'pointer'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div>Loading feedback...</div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="desktop-view" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User / Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFeedback.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                            No feedback found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFeedback.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: item.status === 'reviewed' ? 0.7 : 1 }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.profiles?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.profiles?.role || 'user'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.profiles?.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            weight={i < item.rating ? "fill" : "regular"}
                                                            color={i < item.rating ? "#fbbf24" : "#cbd5e1"}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                                                    background: '#f1f5f9', color: '#475569', textTransform: 'capitalize'
                                                }}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{item.description}</p>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        const subject = encodeURIComponent(`Regarding your feedback: ${item.category}`);
                                                        const body = encodeURIComponent(`Hi ${item.profiles?.name || 'there'},\n\nThank you for your feedback regarding "${item.description.substring(0, 50)}...".\n\n`);
                                                        window.location.href = `mailto:${item.profiles?.email}?subject=${subject}&body=${body}`;
                                                    }}><EnvelopeSimple size={18} /></Button>
                                                    {item.status !== 'reviewed' && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleMarkReviewed(item.id)} style={{ color: '#16a34a' }}><CheckCircle size={18} /></Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} style={{ color: '#ef4444' }}><Trash size={18} /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-view" style={{ display: 'none', flexDirection: 'column', gap: '1rem' }}>
                        {filteredFeedback.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px' }}>
                                No feedback found.
                            </div>
                        ) : (
                            filteredFeedback.map((item) => (
                                <div key={item.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', opacity: item.status === 'reviewed' ? 0.7 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.profiles?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.profiles?.role || 'user'}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} weight={i < item.rating ? "fill" : "regular"} color={i < item.rating ? "#fbbf24" : "#cbd5e1"} />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', textTransform: 'capitalize' }}>
                                            {item.category}
                                        </span>
                                    </div>

                                    <p style={{ color: '#334155', marginBottom: '1rem', lineHeight: '1.5' }}>{item.description}</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                const subject = encodeURIComponent(`Regarding your feedback: ${item.category}`);
                                                const body = encodeURIComponent(`Hi ${item.profiles?.name || 'there'},\n\nThank you for your feedback regarding "${item.description.substring(0, 50)}...".\n\n`);
                                                window.location.href = `mailto:${item.profiles?.email}?subject=${subject}&body=${body}`;
                                            }}><EnvelopeSimple size={18} /></Button>
                                            {item.status !== 'reviewed' && (
                                                <Button variant="ghost" size="sm" onClick={() => handleMarkReviewed(item.id)} style={{ color: '#16a34a' }}><CheckCircle size={18} /></Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} style={{ color: '#ef4444' }}><Trash size={18} /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .desktop-view { display: none !important; }
                    .mobile-view { display: flex !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminFeedback;
