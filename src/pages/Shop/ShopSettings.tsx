import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Storefront, MapPin, Tag, Camera, Plus, Trash, FloppyDisk } from '@phosphor-icons/react';
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
        type: 'Grooming',
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
                    type: shop.shop_type || 'Grooming',
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

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>Shop Settings</h1>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                    <FloppyDisk weight="bold" style={{ marginRight: '0.5rem' }} /> Save Changes
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Sidebar Navigation */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {['basic', 'location', 'visuals', 'services'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem',
                                border: 'none', background: activeTab === tab ? '#eff6ff' : 'transparent',
                                color: activeTab === tab ? 'var(--primary-600)' : '#64748b',
                                fontWeight: activeTab === tab ? 600 : 500, borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem',
                                textAlign: 'left'
                            }}
                        >
                            {tab === 'basic' && <Tag size={20} />}
                            {tab === 'location' && <MapPin size={20} />}
                            {tab === 'visuals' && <Camera size={20} />}
                            {tab === 'services' && <Storefront size={20} />}
                            <span style={{ textTransform: 'capitalize' }}>{tab}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Basic Information</h2>

                            {/* Email - READ ONLY */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#64748b' }}>Owner Email (Cannot be changed)</label>
                                <input value={user?.email} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} />
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Contact support to change email.</p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Shop Name</label>
                                <input value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Business Type</label>
                                <select value={basicInfo.type} onChange={e => setBasicInfo({ ...basicInfo, type: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}>
                                    <option value="Grooming">Grooming Salon</option>
                                    <option value="Vet">Veterinary Clinic</option>
                                    <option value="Training">Training Center</option>
                                    <option value="Boarding">Boarding & Daycare</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
                                <textarea rows={4} value={basicInfo.description} onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            </div>
                        </div>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Location Settings</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>City</label>
                                    <input value={locInfo.city} onChange={e => setLocInfo({ ...locInfo, city: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>State</label>
                                    <input value={locInfo.state} onChange={e => setLocInfo({ ...locInfo, state: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Country</label>
                                <input value={locInfo.country} onChange={e => setLocInfo({ ...locInfo, country: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            </div>

                            {/* Map */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Map Location</label>
                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        placeholder="Search new address..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <Button size="sm" variant="outline" onClick={handleAddressSearch} loading={searching}>Search</Button>
                                </div>
                                <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
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
                                <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                                    <Button size="sm" variant="ghost" onClick={(e) => {
                                        e.preventDefault();
                                        navigator.geolocation.getCurrentPosition(
                                            pos => {
                                                const { latitude, longitude } = pos.coords;
                                                setLocInfo(prev => ({ ...prev, coords: { lat: latitude, lng: longitude } }));
                                            },
                                            () => { alert('Could not get location.'); },
                                            { enableHighAccuracy: true }
                                        );
                                    }}>
                                        <MapPin /> Use My Current Location
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visuals Tab */}
                    {activeTab === 'visuals' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Shop Visuals</h2>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>Shop Logo</label>
                                <div onClick={() => logoInputRef.current?.click()} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: images.logo ? `url(${images.logo}) center/cover` : '#f8fafc' }}>
                                    {!images.logo && <Camera size={32} color="#94a3b8" />}
                                </div>
                                <input type="file" ref={logoInputRef} onChange={handleLogoSelect} accept="image/*" style={{ display: 'none' }} />
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Click to update logo</p>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ fontWeight: 600 }}>Gallery Photos</label>
                                    <Button size="sm" variant="outline" onClick={() => galleryInputRef.current?.click()}><Plus /> Add Photos</Button>
                                    <input type="file" ref={galleryInputRef} onChange={handleGallerySelect} multiple accept="image/*" style={{ display: 'none' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                                    {images.gallery.map((img, idx) => (
                                        <div key={idx} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
                                            <img src={img.url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => deleteGalleryImage(idx, img.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {images.gallery.length === 0 && (
                                        <p style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#94a3b8' }}>No gallery images</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Manage Services</h2>

                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input placeholder="Service Name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    <input type="number" placeholder="Price ($)" value={newService.price} onChange={e => setNewService({ ...newService, price: Number(e.target.value) })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    <input type="number" placeholder="Duration (min)" value={newService.duration} onChange={e => setNewService({ ...newService, duration: Number(e.target.value) })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <Button fullWidth variant="outline" onClick={addService} disabled={!newService.name}>+ Add Service</Button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {services.map((svc, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{svc.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{svc.duration} mins • ${svc.price}</div>
                                        </div>
                                        <button onClick={() => deleteService(i, svc.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash size={18} /></button>
                                    </div>
                                ))}
                                {services.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8' }}>No services found.</p>}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ShopSettings;
