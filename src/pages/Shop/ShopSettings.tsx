import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Storefront, MapPin, Tag, Camera, Plus, Trash, FloppyDisk, PencilSimple } from '@phosphor-icons/react';
import { storageService } from '../../lib/storageService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Reusing Map Components (Should extract to shared component eventually)
// Fix Leaflet Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position ? <Marker position={position}></Marker> : null;
}

function MapController({ coords }: { coords?: { lat: number, lng: number } | null }) {
    const map = useMapEvents({});
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 18, { duration: 1.5 });
        }
    }, [coords, map]);
    return null;
}

function MapUpdater() {
    const map = useMapEvents({});
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
}

const ShopSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);

    // Active Tab
    const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'visuals' | 'services'>('basic');

    // Data States
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        type: [] as string[],
        description: '',
        status: 'pending' // Display only
    });

    const [locInfo, setLocInfo] = useState({
        city: '',
        state: '',
        country: '',
        coords: null as { lat: number, lng: number } | null
    });

    const [images, setImages] = useState({
        logo: null as string | null,
        gallery: [] as { id?: string, url: string, file?: File }[]
    });

    const [services, setServices] = useState<{ id?: string, name: string, price: number, duration: number }[]>([]);
    const [newService, setNewService] = useState({ name: '', price: 0, duration: 30 });

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [isEditingTypes, setIsEditingTypes] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Fetch Data
    useEffect(() => {
        if (!user) return;
        fetchShopData();
    }, [user]);

    const fetchShopData = async () => {
        try {
            setLoading(true);
            const { data: shop, error } = await supabase
                .from('shops')
                .select('*, shop_images(*), services(*)')
                .eq('owner_id', user!.id)
                .single();

            if (error) throw error;
            if (shop) {
                setShopId(shop.id);
                setBasicInfo({
                    name: shop.name,
                    type: Array.isArray(shop.shop_type) ? shop.shop_type : (shop.shop_type ? [shop.shop_type] : []),
                    description: shop.description || '',
                    status: shop.status
                });
                setLocInfo({
                    city: shop.city || '',
                    state: shop.state || '',
                    country: shop.country || '',
                    coords: (shop.latitude && shop.longitude) ? { lat: shop.latitude, lng: shop.longitude } : null
                });

                // Images
                const gallery = shop.shop_images?.map((img: any) => ({
                    id: img.id,
                    url: img.image_url
                })) || [];
                setImages({
                    logo: shop.image_url,
                    gallery
                });

                // Services
                const svcs = shop.services?.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    duration: s.duration_minutes
                })) || [];
                setServices(svcs);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleAddressSearch = async () => {
        if (!searchQuery) return;
        setSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setLocInfo(prev => ({ ...prev, coords: newPos }));
            } else {
                alert('Address not found.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleSave = async () => {
        if (!shopId) return;
        setSaving(true);
        try {
            // 1. Update Basic & Location
            const { error: shopError } = await supabase
                .from('shops')
                .update({
                    name: basicInfo.name,
                    shop_type: basicInfo.type,
                    description: basicInfo.description,
                    city: locInfo.city,
                    state: locInfo.state,
                    country: locInfo.country,
                    location: `${locInfo.city}, ${locInfo.state}, ${locInfo.country}`,
                    latitude: locInfo.coords?.lat,
                    longitude: locInfo.coords?.lng,
                    image_url: images.logo // If base64, handled below? No, separate upload logic needed if changed.
                })
                .eq('id', shopId);

            if (shopError) throw shopError;

            // 2. Handle Logo Upload (if changed to base64)
            // Logic: if images.logo starts with 'data:', upload it.
            if (images.logo && images.logo.startsWith('data:')) {
                const blob = storageService.base64ToBlob(images.logo);
                const logoUrl = await storageService.uploadShopImage(blob, user!.id);
                await supabase.from('shops').update({ image_url: logoUrl }).eq('id', shopId);
            }

            // 3. Handle Gallery (Additions only for now in this logic or we need to diff)
            // Simpler: Just upload new files (those with 'file' prop)
            const newImages = images.gallery.filter(img => img.file);
            for (const img of newImages) {
                const url = await storageService.uploadShopGalleryImage(img.file!, user!.id);
                await supabase.from('shop_images').insert({
                    shop_id: shopId,
                    image_url: url,
                    display_order: 0 // Simplification
                });
            }

            // 4. Handle Services (Upsert logic is complex, let's just insert new ones and update existing?)
            // For simplicity in this edit page:
            // - Existing services (have ID): Update them.
            // - New services (no ID): Insert them.
            // - Deleted services: We need to track deletions. (Advanced). 
            // Current simple logic: Insert new ones.
            // Ideally: We should have specific delete buttons that call API directly.

            // Re-fetch to sync state
            await fetchShopData();
            alert('Changes saved successfully!');

        } catch (err) {
            console.error(err);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    // UI Helpers
    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => setImages(prev => ({ ...prev, logo: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImages = files.map(file => ({
                file,
                url: URL.createObjectURL(file)
            }));
            setImages(prev => ({ ...prev, gallery: [...prev.gallery, ...newImages] }));
        }
    };

    const deleteGalleryImage = async (idx: number, id?: string) => {
        if (id) {
            // Delete from DB
            await supabase.from('shop_images').delete().eq('id', id);
        }
        setImages(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== idx)
        }));
    };

    const addService = () => {
        if (newService.name) {
            // Optimistic Add
            setServices(prev => [...prev, { name: newService.name, price: newService.price, duration: newService.duration }]);
            // Persist immediately? Or wait for save?
            // Let's persist immediately for services since they are list items.
            if (shopId) {
                supabase.from('services').insert({
                    shop_id: shopId,
                    name: newService.name,
                    price: newService.price,
                    duration_minutes: newService.duration
                }).then(({ error }) => {
                    if (!error) fetchShopData(); // Refresh to get ID
                });
            }
            setNewService({ name: '', price: 0, duration: 30 });
        }
    };

    const deleteService = async (idx: number, id?: string) => {
        if (id) {
            await supabase.from('services').delete().eq('id', id);
        }
        setServices(prev => prev.filter((_, i) => i !== idx));
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

    const tabItems = [
        { id: 'basic', label: 'Basic Info', icon: <Storefront size={20} weight={activeTab === 'basic' ? "fill" : "regular"} /> },
        { id: 'location', label: 'Location', icon: <MapPin size={20} weight={activeTab === 'location' ? "fill" : "regular"} /> },
        { id: 'visuals', label: 'Visuals', icon: <Camera size={20} weight={activeTab === 'visuals' ? "fill" : "regular"} /> },
        { id: 'services', label: 'Services', icon: <Tag size={20} weight={activeTab === 'services' ? "fill" : "regular"} /> },
    ];

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', color: '#1e293b' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Shop Settings
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1.1rem' }}>Manage your shop profile, location, and services</p>
                </div>
                <Button variant="primary" onClick={handleSave} loading={saving} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>
                    <FloppyDisk weight="bold" size={20} style={{ marginRight: '0.5rem' }} />
                    Save Changes
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem', alignItems: 'start' }}>
                {/* Sidebar Navigation */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tabItems.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        width: '100%', padding: '1rem 1.25rem',
                                        border: 'none',
                                        background: activeTab === tab.id ? 'linear-gradient(to right, #f3e8ff, white)' : 'transparent',
                                        color: activeTab === tab.id ? '#9333ea' : '#64748b',
                                        fontWeight: activeTab === tab.id ? 700 : 600,
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {activeTab === tab.id && <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '4px', background: '#9333ea', borderRadius: '0 4px 4px 0' }} />}
                                    {tab.icon}
                                    <span style={{ fontSize: '1rem' }}>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', minHeight: '600px', position: 'relative' }}>

                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Storefront weight="duotone" color="#9333ea" /> Basic Information
                            </h2>

                            <div style={{ display: 'grid', gap: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>
                                        Shop Name
                                    </label>
                                    <input
                                        value={basicInfo.name}
                                        onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 500, transition: 'all 0.2s', color: '#1e293b' }}
                                        onFocus={e => { e.target.style.borderColor = '#9333ea'; e.target.style.background = 'white'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>
                                        Business Types
                                    </label>
                                    {!isEditingTypes && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Changing your business type significantly affects how you appear in search results. Are you sure you want to proceed?")) {
                                                    setIsEditingTypes(true);
                                                }
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                        >
                                            <PencilSimple size={14} weight="bold" /> Edit
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', opacity: isEditingTypes ? 1 : 0.6, pointerEvents: isEditingTypes ? 'auto' : 'none', filter: isEditingTypes ? 'none' : 'grayscale(0.5)', transition: 'all 0.3s' }}>
                                    {['Grooming', 'Vet', 'Training', 'Boarding', 'Pet Sitter', 'Walker'].map(type => {
                                        const isSelected = (basicInfo.type as any).includes(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    const currentTypes = Array.isArray(basicInfo.type) ? basicInfo.type : [];
                                                    const newTypes = isSelected
                                                        ? currentTypes.filter((t: string) => t !== type)
                                                        : [...currentTypes, type];
                                                    setBasicInfo({ ...basicInfo, type: newTypes as any });
                                                }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                                                    background: isSelected ? 'var(--primary-600)' : 'white',
                                                    color: isSelected ? 'white' : '#64748b',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isSelected ? '0 4px 6px -1px rgba(147, 51, 234, 0.3)' : 'none'
                                                }}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>
                                        Description
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={basicInfo.description}
                                        onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', lineHeight: '1.6', resize: 'vertical', color: '#1e293b' }}
                                        onFocus={e => { e.target.style.borderColor = '#9333ea'; e.target.style.background = 'white'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                                    />
                                </div>

                                <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#ef4444', marginBottom: '0.5rem' }}>
                                        Registered Email (Read Only)
                                    </label>
                                    <p style={{ fontSize: '1rem', fontWeight: 500, color: '#1e293b' }}>{user?.email}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Contact support to update your business email.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <MapPin weight="duotone" color="#9333ea" /> Location Settings
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>City</label>
                                    <input value={locInfo.city} onChange={e => setLocInfo({ ...locInfo, city: e.target.value })} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>State</label>
                                    <input value={locInfo.state} onChange={e => setLocInfo({ ...locInfo, state: e.target.value })} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>Country</label>
                                <input value={locInfo.country} onChange={e => setLocInfo({ ...locInfo, country: e.target.value })} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ fontWeight: 700, color: '#334155' }}>Map Position</label>
                                    <Button size="sm" variant="ghost" onClick={(e) => {
                                        e.preventDefault();
                                        navigator.geolocation.getCurrentPosition(
                                            async pos => {
                                                const { latitude, longitude } = pos.coords;
                                                setLocInfo(prev => ({ ...prev, coords: { lat: latitude, lng: longitude } }));

                                                try {
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                    const data = await res.json();
                                                    if (data && data.address) {
                                                        const city = data.address.city || data.address.town || data.address.village || '';
                                                        const state = data.address.state || '';
                                                        const country = data.address.country || '';

                                                        setLocInfo(prev => ({
                                                            ...prev,
                                                            city,
                                                            state,
                                                            country,
                                                            coords: { lat: latitude, lng: longitude }
                                                        }));
                                                    }
                                                } catch (err) {
                                                    console.error("Reverse geocoding failed", err);
                                                }
                                            },
                                            () => { alert('Could not get location.'); },
                                            { enableHighAccuracy: true }
                                        );
                                    }}>
                                        <MapPin weight="bold" /> Use My Location
                                    </Button>
                                </div>

                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        placeholder="Search address to pin..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
                                        style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b' }}
                                    />
                                    <Button size="sm" variant="primary" onClick={handleAddressSearch} loading={searching}>Find</Button>
                                </div>

                                <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <MapContainer
                                        center={locInfo.coords || [20.5937, 78.9629]}
                                        zoom={locInfo.coords ? 18 : 4}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                                        <LocationMarker position={locInfo.coords} setPosition={(pos) => setLocInfo(prev => ({ ...prev, coords: pos }))} />
                                        <MapController coords={locInfo.coords} />
                                        <MapUpdater />
                                    </MapContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visuals Tab */}
                    {activeTab === 'visuals' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Camera weight="duotone" color="#9333ea" /> Shop Visuals
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '2rem', alignItems: 'center' }}>
                                <div onClick={() => logoInputRef.current?.click()} style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: images.logo ? `url(${images.logo}) center/cover` : '#f1f5f9', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    {!images.logo && <Camera size={40} color="#cbd5e1" weight="duotone" />}
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover-overlay">
                                        <Camera size={24} color="white" />
                                    </div>
                                    <style>{` .hover-overlay:hover { opacity: 1 !important; } `}</style>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Brand Logo</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', margin: '0.5rem 0 1rem 0' }}>This logo will appear in search results and on your shop profile.</p>
                                    <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>Upload New Logo</Button>
                                    <input type="file" ref={logoInputRef} onChange={handleLogoSelect} accept="image/*" style={{ display: 'none' }} />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Gallery Photos</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Showcase your facility and work</p>
                                    </div>
                                    <Button size="sm" variant="primary" onClick={() => galleryInputRef.current?.click()}>
                                        <Plus weight="bold" /> Add Photos
                                    </Button>
                                    <input type="file" ref={galleryInputRef} onChange={handleGallerySelect} multiple accept="image/*" style={{ display: 'none' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                    {images.gallery.map((img, idx) => (
                                        <div key={idx} style={{ aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', position: 'relative', background: '#f8fafc', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                                            <img src={img.url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)' }} />
                                            <button
                                                onClick={() => deleteGalleryImage(idx, img.id)}
                                                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255, 255, 255, 0.9)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <Trash size={16} weight="bold" />
                                            </button>
                                        </div>
                                    ))}
                                    {images.gallery.length === 0 && (
                                        <div style={{ gridColumn: '1/-1', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '16px', color: '#94a3b8', gap: '1rem' }}>
                                            <Camera size={48} weight="thin" />
                                            <p>No photos yet. Add some to attract customers!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Tag weight="duotone" color="#9333ea" /> Manage Services
                            </h2>

                            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#334155' }}>Add New Service</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                                    <input placeholder="Service Name (e.g., Full Grooming)" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} style={{ padding: '0.875rem', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', color: '#1e293b' }} />
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600 }}>₹</span>
                                        <input type="number" placeholder="Price" value={newService.price} onChange={e => setNewService({ ...newService, price: Number(e.target.value) })} style={{ padding: '0.875rem 0.875rem 0.875rem 25px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', color: '#1e293b' }} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" placeholder="Duration" value={newService.duration} onChange={e => setNewService({ ...newService, duration: Number(e.target.value) })} style={{ padding: '0.875rem 0.875rem 0.875rem 10px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', color: '#1e293b' }} />
                                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>min</span>
                                    </div>
                                    <Button variant="primary" onClick={addService} disabled={!newService.name} style={{ height: '46px', width: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                                        <Plus weight="bold" size={20} />
                                    </Button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {services.map((svc, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 4px 6px -2px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                                                <Storefront weight="duotone" size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{svc.name}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                                    <span>{svc.duration} mins</span>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                                                    <span>₹{svc.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteService(i, svc.id)} style={{ color: '#ef4444', background: 'rgba(254, 226, 226, 0.5)', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }}>
                                            <Trash size={18} weight="bold" />
                                        </button>
                                    </div>
                                ))}
                                {services.length === 0 && (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <Tag size={40} weight="thin" />
                                        <p style={{ marginTop: '1rem' }}>No services added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopSettings;
