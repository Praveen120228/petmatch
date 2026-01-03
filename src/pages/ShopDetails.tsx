import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Storefront, Check, CalendarBlank, Clock, PawPrint, CaretLeft } from '@phosphor-icons/react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isSameDay, addDays, startOfToday } from 'date-fns';
import SEO from '../components/SEO';

// --- Horizontal Date Picker Component ---
const DateSelector = ({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) => {
    const dates = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div style={{ position: 'relative', margin: '0 -1rem' }}> {/* Negative margin to bleed to edges on mobile */}
            <div
                ref={scrollRef}
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '0.75rem',
                    padding: '0.5rem 1rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth'
                }}
            >
                {dates.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                        <div
                            key={date.toISOString()}
                            onClick={() => onSelect(date)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '64px',
                                height: '70px',
                                borderRadius: '12px',
                                background: isSelected ? 'var(--primary-600)' : 'white',
                                color: isSelected ? 'white' : 'var(--color-text-primary)',
                                border: isSelected ? 'none' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                                boxShadow: isSelected ? '0 4px 6px -1px var(--primary-100)' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>
                                {format(date, 'EEE')}
                            </span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {format(date, 'd')}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Fade effect on right */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, white, transparent)', pointerEvents: 'none' }} />
        </div>
    );
};

const ShopDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shop, setShop] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [gallery, setGallery] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking Flow State
    const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Pet

    // Selections
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [selectedPet, setSelectedPet] = useState<any>(null);

    const [userPets, setUserPets] = useState<any[]>([]);
    const [bookingProcessing, setBookingProcessing] = useState(false);
    const [heroImage, setHeroImage] = useState<string | null>(null);

    // Refs for scrolling
    const step2Ref = useRef<HTMLDivElement>(null);
    const step3Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) fetchShopDetails();
    }, [id]);

    useEffect(() => {
        if (user) fetchUserPets();
    }, [user]);

    // Auto-scroll to next step
    useEffect(() => {
        if (step === 2 && step2Ref.current) {
            step2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (step === 3 && step3Ref.current) {
            step3Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [step]);

    const fetchUserPets = async () => {
        const { data } = await supabase.from('pets').select('*').eq('owner_id', user!.id);
        if (data) setUserPets(data);
    };

    const fetchShopDetails = async () => {
        try {
            // Fetch Shop, Services, Gallery, Slots (same as before)
            const [shopRes, svcRes, galleryRes] = await Promise.all([
                supabase.from('shops').select('*').eq('id', id).eq('status', 'approved').single(),
                supabase.from('services').select('*').eq('shop_id', id),
                supabase.from('shop_images').select('*').eq('shop_id', id).order('display_order')
            ]);

            setShop(shopRes.data);
            setHeroImage(shopRes.data?.image_url);
            setServices(svcRes.data || []);
            setGallery(galleryRes.data || []);

            // Fetch Future Slots
            const { data: slotsData } = await supabase
                .from('time_slots')
                .select('*')
                .eq('shop_id', id)
                .eq('is_booked', false)
                .gte('start_time', new Date().toISOString());

            setSlots(slotsData || []);

        } finally {
            setLoading(false);
        }
    };

    const handleServiceSelect = (svc: any) => {
        setSelectedService(svc);
        setStep(2);
        // Reset subsequent layouts
        setSelectedSlot(null);
        setSelectedPet(null);
    };

    const handleSlotSelect = (slot: any) => {
        setSelectedSlot(slot);
        if (userPets.length > 0) {
            setStep(3);
        } else {
            // If no pets, maybe show prompt or just allow booking? 
            // Logic: Assume they might add pet later or generic booking. 
            // For now, let's just stay on step 2 but enable booking button.
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
                pet_id: selectedPet?.id,
                status: 'pending'
            });

            if (error) throw error;
            await supabase.from('time_slots').update({ is_booked: true }).eq('id', selectedSlot.id);

            alert('Booking request sent successfully!');
            navigate('/profile');
        } catch (err: any) {
            alert('Booking failed: ' + err.message);
        } finally {
            setBookingProcessing(false);
        }
    };

    // Filter Logic
    const availableSlotsForDate = slots.filter(s => {
        const isDateMatch = isSameDay(parseISO(s.start_time), selectedDate);
        if (!isDateMatch) return false;
        if (selectedService) return s.service_id === null || s.service_id === selectedService.id;
        return true;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    if (loading) return <div className="page-container fade-in">Loading shop details...</div>;
    if (!shop) return <div className="page-container fade-in">Shop not found.</div>;

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '100px' }}> {/* Extra padding for mobile scroll */}
            <SEO title={`${shop.name} | Specyf`} description={shop.description} />

            {/* Back Button */}
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', fontWeight: 600 }}>
                <CaretLeft /> Back
            </button>

            {/* Layout Grid */}
            <div className="shop-details-grid" style={{ display: 'grid', gap: '2rem' }}>

                {/* Left Column: Details & Booking Flow */}
                <div>
                    {/* Header Info */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', height: '300px', borderRadius: '16px', overflow: 'hidden', background: heroImage ? `url(${heroImage}) center/cover` : '#f1f5f9', marginBottom: '1.5rem' }}>
                            {/* Gallery Thumbs */}
                            {gallery.length > 0 && (
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px', padding: '6px', background: 'rgba(255,255,255,0.9)', borderRadius: '10px' }}>
                                    {[shop, ...gallery].slice(0, 4).map((img: any, i) => (
                                        <div key={i} onClick={() => setHeroImage(img.image_url)} style={{ width: '40px', height: '40px', borderRadius: '6px', background: `url(${img.image_url || img}) center/cover`, cursor: 'pointer', border: heroImage === (img.image_url || img) ? '2px solid var(--primary-600)' : 'none' }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{shop.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginTop: '0.5rem' }}>
                            <MapPin weight="fill" /> {shop.location || `${shop.city}, ${shop.state}`}
                        </div>
                    </div>

                    {/* --- STEP 1: SERVICE --- */}
                    <div className="step-container" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: selectedService ? 'var(--primary-600)' : '#e2e8f0', color: selectedService ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>1</span>
                                Select Service
                            </h2>
                            {selectedService && <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Change</Button>}
                        </div>

                        {(step === 1 || !selectedService) ? (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {services.map(svc => (
                                    <div
                                        key={svc.id}
                                        onClick={() => handleServiceSelect(svc)}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            border: selectedService?.id === svc.id ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                                            background: selectedService?.id === svc.id ? 'var(--primary-50)' : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{svc.name}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>{svc.duration_minutes} mins</div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--primary-600)' }}>₹{svc.price}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontWeight: 600 }}>{selectedService.name}</div>
                                <Check color="var(--primary-600)" weight="bold" />
                            </div>
                        )}
                    </div>

                    {/* --- STEP 2: DATE & TIME --- */}
                    {selectedService && (
                        <div className="fade-in step-container" ref={step2Ref} style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: selectedSlot ? 'var(--primary-600)' : '#e2e8f0', color: selectedSlot ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>2</span>
                                    Select Date & Time
                                </h2>
                            </div>

                            <Card padding="lg">
                                {/* Horizontal Date Picker */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>DATE</label>
                                    <DateSelector selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} />
                                </div>

                                <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '1.5rem' }} />

                                {/* Time Slots */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>AVAILABLE TIMES</label>
                                    {availableSlotsForDate.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                                            <CalendarBlank size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                            <div>No slots available on {format(selectedDate, 'MMMM d')}.</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem' }}>
                                            {availableSlotsForDate.map(slot => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => handleSlotSelect(slot)}
                                                    style={{
                                                        padding: '0.75rem 0.5rem',
                                                        borderRadius: '8px',
                                                        border: selectedSlot?.id === slot.id ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                                                        background: selectedSlot?.id === slot.id ? 'var(--primary-600)' : 'white',
                                                        color: selectedSlot?.id === slot.id ? 'white' : '#1e293b',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.1s'
                                                    }}
                                                >
                                                    {format(parseISO(slot.start_time), 'HH:mm')}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* --- STEP 3: PET --- */}
                    {selectedSlot && userPets.length > 0 && (
                        <div className="fade-in step-container" ref={step3Ref} style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: selectedPet ? 'var(--primary-600)' : '#e2e8f0', color: selectedPet ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>3</span>
                                    Who is this for?
                                </h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                {userPets.map(pet => (
                                    <div
                                        key={pet.id}
                                        onClick={() => setSelectedPet(pet)}
                                        style={{
                                            border: selectedPet?.id === pet.id ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            background: selectedPet?.id === pet.id ? '#eff6ff' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: pet.image ? `url(${pet.image}) center/cover` : '#e2e8f0', margin: '0 auto 0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{pet.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pet.breed}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column: Sticky Summary */}
                <div>
                    <Card style={{ position: 'sticky', top: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Booking Summary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Storefront /> Service</span>
                                <span style={{ fontWeight: 600 }}>{selectedService ? selectedService.name : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><CalendarBlank /> Date</span>
                                <span style={{ fontWeight: 600 }}>{selectedSlot ? format(parseISO(selectedSlot.start_time), 'MMM d, yyyy') : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Clock /> Time</span>
                                <span style={{ fontWeight: 600 }}>{selectedSlot ? format(parseISO(selectedSlot.start_time), 'HH:mm') : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><PawPrint /> Pet</span>
                                <span style={{ fontWeight: 600 }}>{selectedPet ? selectedPet.name : (userPets.length > 0 ? '-' : 'N/A')}</span>
                            </div>

                            <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                                <span>Total</span>
                                <span>{selectedService ? `₹${selectedService.price}` : '₹0'}</span>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            disabled={!selectedService || !selectedSlot || bookingProcessing || (userPets.length > 0 && !selectedPet)}
                            onClick={handleBook}
                            style={{ boxShadow: '0 4px 6px -1px var(--primary-200)' }}
                        >
                            {bookingProcessing ? 'Processing...' : user ? 'Confirm Booking' : 'Log in to Book'}
                        </Button>
                    </Card>
                </div>
            </div>

            <style>{`
                .shop-details-grid {
                    grid-template-columns: 2fr 1fr;
                }
                @media (max-width: 768px) {
                    .shop-details-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default ShopDetails;
