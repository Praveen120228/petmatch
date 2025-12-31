import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Card from '../../components/Card';
import { CheckCircle, XCircle, Clock, Calendar, User } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';

const ShopBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const fetchBookings = async () => {
        if (!user) return;
        try {
            // Get Shop ID first
            const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();

            if (shop) {
                const { data } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        slot:time_slots(*),
                        service:services(*),
                        customer:profiles(*),
                        pet:pets(*)
                    `)
                    .eq('shop_id', shop.id)
                    .order('created_at', { ascending: false });

                if (data) setBookings(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
        if (!error) {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

            // If confirmed, mark slot as booked (if not already logic handled elsewhere, though table constraint logic usually better)
            // Ideally trigger handles this, but for now simple frontend logic:
            if (newStatus === 'confirmed') {
                const booking = bookings.find(b => b.id === id);
                if (booking && booking.slot_id) {
                    await supabase.from('time_slots').update({ is_booked: true }).eq('id', booking.slot_id);
                }
            }
            if (newStatus === 'rejected' || newStatus === 'cancelled') {
                const booking = bookings.find(b => b.id === id);
                if (booking && booking.slot_id) {
                    await supabase.from('time_slots').update({ is_booked: false }).eq('id', booking.slot_id);
                }
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#d1fae5'; // green-100
            case 'completed': return '#e0e7ff'; // indigo-100
            case 'rejected': return '#fee2e2'; // red-100
            case 'pending': return '#ffedd5'; // orange-100
            default: return '#f1f5f9';
        }
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Bookings</h1>
                <p style={{ color: '#64748b' }}>Manage your incoming appointments.</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {bookings.length === 0 ? (
                    <Card><p style={{ textAlign: 'center', color: '#94a3b8' }}>No bookings found.</p></Card>
                ) : (
                    bookings.map(booking => (
                        <Card key={booking.id} padding="lg">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Header: Status + Date */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{
                                            background: getStatusColor(booking.status),
                                            color: '#1e293b',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            textTransform: 'uppercase'
                                        }}>
                                            {booking.status}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={16} />
                                            {booking.slot ? format(parseISO(booking.slot.start_time), 'PPP') : 'No Date'}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={16} />
                                            {booking.slot ? `${format(parseISO(booking.slot.start_time), 'p')} - ${format(parseISO(booking.slot.end_time), 'p')}` : ''}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {booking.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                                            >
                                                <CheckCircle size={18} weight="fill" /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                                            >
                                                <XCircle size={18} weight="fill" /> Reject
                                            </button>
                                        </div>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                                            >
                                                <CheckCircle size={18} /> Mark Complete
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Body Divider */}
                                <div style={{ height: '1px', background: '#f1f5f9' }} />

                                {/* Detailed Body Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                                    {/* Column 1: Customer & Service */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>The Customer</div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                    {booking.customer?.avatar_url ? <img src={booking.customer.avatar_url} style={{ width: '100%' }} /> : <User size={24} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{booking.customer?.name || 'Unknown User'}</div>

                                                    {/* Contact Info */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                        {booking.customer?.email && (
                                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>✉️ {booking.customer.email}</div>
                                                        )}
                                                        {booking.customer?.phone_number && (
                                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>📞 {booking.customer.phone_number}</div>
                                                        )}
                                                        {booking.customer?.location && (
                                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>📍 {booking.customer.location}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Requested Service</div>
                                            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontWeight: 600, color: '#334155' }}>{booking.service?.name || 'Custom Service'}</div>
                                                {booking.service?.duration_minutes && (
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Duration: {booking.service.duration_minutes} mins</div>
                                                )}
                                                {booking.service?.price && (
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Price: ₹{booking.service.price}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Pet Details */}
                                    {booking.pet && (
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>The Pet</div>
                                            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '1rem', border: '1px solid #e0f2fe' }}>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        {booking.pet.image ? <img src={booking.pet.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>🐾</span>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0c4a6e' }}>{booking.pet.name}</div>
                                                        <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 600 }}>{booking.pet.breed}</div>
                                                        <div style={{ fontSize: '0.85rem', marginTop: '2px', display: 'flex', gap: '8px', color: '#0369a1' }}>
                                                            <span>{booking.pet.age} old</span> • <span>{booking.pet.gender}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {booking.pet.bio && (
                                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>
                                                        "{booking.pet.bio}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ShopBookings;
