import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CalendarCheck, Funnel, Storefront, User } from '@phosphor-icons/react';
import Button from '../../components/Button';

const AdminBookings = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    shop:shops(name),
                    user:profiles(name, email),
                    slot:time_slots(start_time, end_time)
                `)
                .order('created_at', { ascending: false }); // Sort by creation since ordering by joined column is complex in basic select

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '#059669' };
            case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: '#d97706' };
            case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: '#b91c1c' };
            case 'completed': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: '#2563eb' };
            default: return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: '#475569' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>Global Bookings</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Funnel size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <Button variant="outline" onClick={fetchBookings} disabled={loading} style={{ borderColor: '#334155', color: '#94a3b8', background: '#1e293b' }}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8' }}>Loading bookings...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bookings.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', color: '#94a3b8', border: '1px solid #334155' }}>
                            <CalendarCheck size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No {statusFilter !== 'all' ? statusFilter : ''} bookings found.</p>
                        </div>
                    )}

                    {bookings.map(booking => {
                        const statusColor = getStatusColor(booking.status);
                        return (
                            <div key={booking.id} style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>
                                                {booking.slot?.start_time ? new Date(booking.slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date'}
                                            </span>
                                            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                                {booking.slot ? `${new Date(booking.slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '99px', background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Storefront weight="bold" color="#64748b" />
                                                {booking.shop?.name || 'Unknown Shop'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <User weight="bold" color="#64748b" />
                                                {booking.user?.name || booking.user?.email || 'Unknown User'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#2dd4bf' }}>
                                            ${booking.price}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {booking.id.slice(0, 8)}</div>
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

export default AdminBookings;
