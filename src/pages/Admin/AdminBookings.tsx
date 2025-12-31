import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CalendarCheck, Funnel, Storefront, User } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';

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
                    user:profiles(name, email)
                `)
                .order('date', { ascending: false });

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
            case 'confirmed': return { bg: '#dcfce7', text: '#166534' };
            case 'pending': return { bg: '#fef3c7', text: '#92400e' };
            case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
            case 'completed': return { bg: '#dbeafe', text: '#1e40af' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Global Bookings</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Funnel size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#1e293b',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <Button variant="outline" onClick={fetchBookings} disabled={loading}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div>Loading bookings...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bookings.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#94a3b8' }}>
                            <CalendarCheck size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No {statusFilter !== 'all' ? statusFilter : ''} bookings found.</p>
                        </div>
                    )}

                    {bookings.map(booking => {
                        const statusColor = getStatusColor(booking.status);
                        return (
                            <Card key={booking.id} padding="lg">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                                                {new Date(booking.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                {booking.time}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '99px', background: statusColor.bg, color: statusColor.text }}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Storefront weight="bold" />
                                                {booking.shop?.name || 'Unknown Shop'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <User weight="bold" />
                                                {booking.user?.name || booking.user?.email || 'Unknown User'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}>
                                            ${booking.price}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {booking.id.slice(0, 8)}</div>
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

export default AdminBookings;
