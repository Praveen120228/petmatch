import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trash, Plus, MagicWand } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { format, addMinutes, parseISO, startOfToday } from 'date-fns';

const ShopSchedule = () => {
    const { user } = useAuth();
    const [slots, setSlots] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopId, setShopId] = useState<string | null>(null);

    // Form State
    const [date, setDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [duration, setDuration] = useState(30);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('all');

    useEffect(() => {
        fetchShopAndData();
    }, [user]);

    const fetchShopAndData = async () => {
        if (!user) return;
        try {
            const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
            if (shop) {
                setShopId(shop.id);
                fetchSlots(shop.id);
                fetchServices(shop.id);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async (sId: string) => {
        const { data } = await supabase.from('services').select('*').eq('shop_id', sId);
        if (data) setServices(data);
    };

    const fetchSlots = async (sId: string) => {
        const { data } = await supabase
            .from('time_slots')
            .select('*, service:services(name)')
            .eq('shop_id', sId)
            .order('start_time', { ascending: true });

        if (data) setSlots(data);
    };

    const handleCreateSlots = async () => {
        if (!shopId) return alert("Shop not found. Please create a profile first.");

        // Generate slots
        const startDateTime = parseISO(`${date}T${startTime}`);
        const endDateTime = parseISO(`${date}T${endTime}`);

        const newSlots = [];
        let current = startDateTime;

        while (current < endDateTime) {
            const next = addMinutes(current, duration);
            if (next > endDateTime) break;

            newSlots.push({
                shop_id: shopId,
                start_time: current.toISOString(),
                end_time: next.toISOString(),
                is_booked: false,
                service_id: selectedServiceId === 'all' ? null : selectedServiceId
            });
            current = next;
        }

        const { error } = await supabase.from('time_slots').insert(newSlots);

        if (error) {
            alert('Failed to create slots: ' + error.message);
        } else {
            fetchSlots(shopId);
            alert(`Generated ${newSlots.length} slots!`);
        }
    };

    const handleDeleteSlot = async (id: string) => {
        if (!confirm('Delete this slot?')) return;
        await supabase.from('time_slots').delete().eq('id', id);
        setSlots(prev => prev.filter(s => s.id !== id));
    };

    const handleQuickSetDuration = (mins: number) => {
        setDuration(mins);
    };

    if (loading) return <div>Loading...</div>;
    if (!shopId) return <div className="fade-in"><Card>Please set up your Shop Details in the Services/Profile tab first.</Card></div>;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Schedule Management</h1>
                <p style={{ color: '#64748b' }}>Generate available time slots for your customers.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

                {/* Generator Panel */}
                <div>
                    <Card padding="xl">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={20} /> Generate Slots
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Service (Optional)</label>
                                <select
                                    value={selectedServiceId}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setSelectedServiceId(val);
                                        if (val !== 'all') {
                                            const svc = services.find(s => s.id === val);
                                            if (svc) setDuration(svc.duration_minutes);
                                        }
                                    }}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="all">Any Service (Generic Slot)</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}m)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Start Time</label>
                                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>End Time</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Slot Duration (Min)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    {/* Quick Suggestions from Services */}
                                    {services.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleQuickSetDuration(s.duration_minutes)}
                                            style={{
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                border: '1px solid var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-700)',
                                                cursor: 'pointer'
                                            }}
                                            title={`Set to ${s.name} duration`}
                                        >
                                            {s.name} ({s.duration_minutes}m)
                                        </button>
                                    ))}
                                </div>
                                <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                    <option value={90}>90 Minutes</option>
                                    <option value={120}>2 Hours</option>
                                </select>
                            </div>

                            <Button variant="primary" fullWidth onClick={handleCreateSlots} style={{ marginTop: '1rem' }}>
                                <MagicWand weight="bold" style={{ marginRight: '0.5rem' }} /> Generate Slots
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Slots List */}
                <div>
                    <Card padding="xl">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upcoming Slots</h3>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{slots.length} Slots</span>
                        </div>

                        {slots.length === 0 ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No slots generated yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                {slots.map(slot => (
                                    <div key={slot.id} style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: slot.is_booked ? '#fef2f2' : '#f0fdf4',
                                        position: 'relative'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                            {format(parseISO(slot.start_time), 'MMM d, yyyy')}
                                        </div>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>
                                            {format(parseISO(slot.start_time), 'HH:mm')} - {format(parseISO(slot.end_time), 'HH:mm')}
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: slot.is_booked ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
                                            {slot.is_booked ? 'BOOKED' : 'AVAILABLE'}
                                            {slot.service && <span style={{ marginLeft: '0.5rem', color: '#6366f1' }}>• {slot.service.name} Only</span>}
                                        </div>

                                        {!slot.is_booked && (
                                            <button
                                                onClick={() => handleDeleteSlot(slot.id)}
                                                style={{
                                                    position: 'absolute', top: '5px', right: '5px',
                                                    background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer'
                                                }}
                                                title="Delete Slot"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default ShopSchedule;
