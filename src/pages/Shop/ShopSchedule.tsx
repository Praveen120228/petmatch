import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trash, Plus, MagicWand, CalendarBlank, CaretDown, CaretRight } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Card from '../../components/Card';
import { format, addMinutes, parseISO, startOfToday, differenceInCalendarDays } from 'date-fns';

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

    // UI State
    const [manuallyToggled, setManuallyToggled] = useState<Record<string, boolean>>({});

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
            const dateKey = format(startDateTime, 'yyyy-MM-dd');
            // Auto-expand the newly created date
            setManuallyToggled(prev => ({ ...prev, [dateKey]: true }));
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

    // Group slots by date
    const groupedSlots = useMemo(() => {
        return slots.reduce((acc, slot) => {
            const dateKey = format(parseISO(slot.start_time), 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(slot);
            return acc;
        }, {} as Record<string, typeof slots>);
    }, [slots]);

    const sortedDates = Object.keys(groupedSlots).sort();

    const toggleSection = (dateKey: string) => {
        setManuallyToggled(prev => ({
            ...prev,
            [dateKey]: !isSectionExpanded(dateKey)
        }));
    };

    const isSectionExpanded = (dateKey: string) => {
        if (manuallyToggled[dateKey] !== undefined) return manuallyToggled[dateKey];

        // Default logic: Expand Today and Tomorrow
        const date = parseISO(dateKey);
        const today = startOfToday();
        const diff = differenceInCalendarDays(date, today);
        return diff >= 0 && diff <= 1;
    };

    if (loading) return <div>Loading...</div>;
    if (!shopId) return <div className="fade-in"><Card>Please set up your Shop Details in the Services/Profile tab first.</Card></div>;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Schedule Management</h1>
                <p style={{ color: '#64748b' }}>Generate available time slots for your customers.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                {/* Generator Panel */}
                <div style={{ height: 'fit-content' }}>
                    <Card padding="xl" style={{ position: 'sticky', top: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={20} /> Generate Slots
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <Select
                                    label="Service (Optional)"
                                    value={selectedServiceId}
                                    onChange={(val) => {
                                        setSelectedServiceId(val);
                                        if (val !== 'all') {
                                            const svc = services.find(s => s.id === val);
                                            if (svc) setDuration(svc.duration_minutes);
                                        }
                                    }}
                                    options={[
                                        { label: 'Any Service (Generic Slot)', value: 'all' },
                                        ...services.map(s => ({ label: `${s.name} (${s.duration_minutes}m)`, value: s.id }))
                                    ]}
                                    fullWidth
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '0.9rem', borderRadius: '16px', border: '1px solid #e5e7eb', fontFamily: 'inherit', color: '#1e293b' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Start Time</label>
                                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.9rem', borderRadius: '16px', border: '1px solid #e5e7eb', fontFamily: 'inherit', color: '#1e293b' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>End Time</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '0.9rem', borderRadius: '16px', border: '1px solid #e5e7eb', fontFamily: 'inherit', color: '#1e293b' }} />
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
                                                fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px',
                                                border: '1px solid var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-700)',
                                                cursor: 'pointer', fontWeight: 600
                                            }}
                                            title={`Set to ${s.name} duration`}
                                        >
                                            {s.name} ({s.duration_minutes}m)
                                        </button>
                                    ))}
                                </div>
                                <Select
                                    value={duration}
                                    onChange={(val) => setDuration(Number(val))}
                                    options={[
                                        { label: '15 Minutes', value: 15 },
                                        { label: '30 Minutes', value: 30 },
                                        { label: '45 Minutes', value: 45 },
                                        { label: '60 Minutes', value: 60 },
                                        { label: '90 Minutes', value: 90 },
                                        { label: '2 Hours', value: 120 }
                                    ]}
                                    fullWidth
                                />
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
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{slots.length} Total</span>
                        </div>

                        {sortedDates.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                <CalendarBlank size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p>No slots generated yet. Use the generator on the left.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {sortedDates.map(dateKey => {
                                    const expanded = isSectionExpanded(dateKey);
                                    return (
                                        <div key={dateKey} className="fade-in">
                                            <h4
                                                onClick={() => toggleSection(dateKey)}
                                                style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: 700,
                                                    marginBottom: '1rem',
                                                    color: 'var(--gray-800)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderBottom: '1px solid #e2e8f0',
                                                    paddingBottom: '0.5rem',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {expanded ? <CaretDown /> : <CaretRight />}
                                                    {format(parseISO(dateKey), 'EEEE, MMMM d')}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: '#64748b' }}>
                                                    {groupedSlots[dateKey].length} Slots
                                                </span>
                                            </h4>

                                            {expanded && (
                                                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                                    {groupedSlots[dateKey].map((slot: any) => (
                                                        <div key={slot.id} style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            background: slot.is_booked ? '#fef2f2' : 'white',
                                                            position: 'relative',
                                                            transition: 'all 0.2s',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                        }}
                                                            onMouseEnter={e => { if (!slot.is_booked) e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
                                                            onMouseLeave={e => { if (!slot.is_booked) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                        >
                                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                                                {format(parseISO(slot.start_time), 'HH:mm')}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                {format(parseISO(slot.end_time), 'HH:mm')}
                                                            </div>

                                                            {slot.service && (
                                                                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                                                                    {slot.service.name}
                                                                </div>
                                                            )}

                                                            {slot.is_booked ? (
                                                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} /> BOOKED
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                                    style={{
                                                                        position: 'absolute', top: '8px', right: '8px',
                                                                        background: 'white', border: '1px solid #e2e8f0', color: '#94a3b8', cursor: 'pointer',
                                                                        width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                    }}
                                                                    title="Delete Slot"
                                                                >
                                                                    <Trash size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: minmax(300px, 1fr) 2fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ShopSchedule;
