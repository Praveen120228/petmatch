import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin } from '@phosphor-icons/react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isSameDay } from 'date-fns';
import SEO from '../components/SEO';

const ShopDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Need auth to book
    const [shop, setShop] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [bookingProcessing, setBookingProcessing] = useState(false);

    useEffect(() => {
        if (id) fetchShopDetails();
    }, [id]);

    const fetchShopDetails = async () => {
        try {
            // 1. Fetch Shop
            const { data: shopData } = await supabase.from('shops').select('*').eq('id', id).single();
            setShop(shopData);

            // 2. Fetch Services
            const { data: svcData } = await supabase.from('services').select('*').eq('shop_id', id);
            setServices(svcData || []);

            // 3. Fetch Slots
            // In a real app, maybe filter by date range
            const { data: slotsData } = await supabase
                .from('time_slots')
                .select('*')
                .eq('shop_id', id)
                .eq('is_booked', false) // Only available
                .gte('start_time', new Date().toISOString()); // Only future

            setSlots(slotsData || []);

        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!selectedSlot || !selectedService) return;

        setBookingProcessing(true);
        try {
            const { error } = await supabase.from('bookings').insert({
                customer_id: user.id,
                shop_id: shop.id,
                service_id: selectedService.id,
                slot_id: selectedSlot.id,
                status: 'pending'
            });

            if (error) throw error;

            // Optimistically update slot to booked or wait for refresh
            // In a real transactional app booking logic is complex (race conditions). 
            // For now, we assume success.
            await supabase.from('time_slots').update({ is_booked: true }).eq('id', selectedSlot.id);

            alert('Booking request sent successfully!');
            navigate('/profile'); // Or bookings page for user

        } catch (err: any) {
            alert('Booking failed: ' + err.message);
        } finally {
            setBookingProcessing(false);
        }
    };

    // Filter slots for selected Date
    const availableSlotsForDate = slots.filter(s => isSameDay(parseISO(s.start_time), selectedDate))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    if (loading) return <div className="page-container fade-in">Loading shop details...</div>;
    if (!shop) return <div className="page-container fade-in">Shop not found.</div>;

    return (
        <div className="page-container fade-in">
            <SEO title={`${shop.name} | Specyf`} description={shop.description} />

            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>{shop.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '1.1rem' }}>
                    <MapPin size={20} weight="fill" /> {shop.location || 'Location not available'}
                </div>
                {shop.description && <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', lineHeight: 1.6, color: '#475569', maxWidth: '800px' }}>{shop.description}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
                {/* Left Column: Services & Selection */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Select Service</h2>
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
                        {services.length === 0 ? <p style={{ color: '#94a3b8' }}>No services listed.</p> :
                            services.map(svc => (
                                <div
                                    key={svc.id}
                                    onClick={() => setSelectedService(svc)}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        border: selectedService?.id === svc.id ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                                        background: selectedService?.id === svc.id ? '#eff6ff' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{svc.name}</div>
                                        <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{svc.duration_minutes} mins</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-600)' }}>
                                        ${svc.price}
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    {selectedService && (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Select Time</h2>

                            {/* Simple Date Picker (Native) */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Date</label>
                                <input
                                    type="date"
                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                        if (e.target.value) setSelectedDate(parseISO(e.target.value));
                                        setSelectedSlot(null);
                                    }}
                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                />
                            </div>

                            {/* Slots Grid */}
                            {availableSlotsForDate.length === 0 ? (
                                <p style={{ color: '#ef4444', background: '#fef2f2', padding: '1rem', borderRadius: '8px' }}>No available slots for this date.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                    {availableSlotsForDate.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedSlot(slot)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: selectedSlot?.id === slot.id ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                                                background: selectedSlot?.id === slot.id ? 'var(--primary-600)' : 'white',
                                                color: selectedSlot?.id === slot.id ? 'white' : '#1e293b',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {format(parseISO(slot.start_time), 'HH:mm')}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Summary Card */}
                <div>
                    <Card style={{ position: 'sticky', top: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Booking Summary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Service</span>
                                <span style={{ fontWeight: 600, textAlign: 'right' }}>{selectedService ? selectedService.name : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Date</span>
                                <span style={{ fontWeight: 600, textAlign: 'right' }}>{selectedDate ? format(selectedDate, 'MMM d, yyyy') : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Time</span>
                                <span style={{ fontWeight: 600, textAlign: 'right' }}>
                                    {selectedSlot ? format(parseISO(selectedSlot.start_time), 'HH:mm') : '-'}
                                </span>
                            </div>
                            <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
                                <span>Total</span>
                                <span>{selectedService ? `$${selectedService.price}` : '$0'}</span>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            disabled={!selectedService || !selectedSlot || bookingProcessing}
                            onClick={handleBook}
                        >
                            {bookingProcessing ? 'Processing...' : user ? 'Confirm Booking' : 'Log in to Book'}
                        </Button>

                        {!user && (
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center', color: '#64748b' }}>
                                You'll need to sign in to complete your booking.
                            </p>
                        )}
                    </Card>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 350px"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ShopDetails;
