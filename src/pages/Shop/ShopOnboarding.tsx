import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Select from '../../components/Select';
import { Storefront, MapPin, Tag, Camera, CaretRight, CaretLeft, Check, Plus, Trash, Images } from '@phosphor-icons/react';
import { storageService } from '../../lib/storageService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Map Click Component
function LocationMarker({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position ? <Marker position={position}></Marker> : null;
}

// Improved Controller
function MapController({ coords }: { coords?: { lat: number, lng: number } | null }) {
    const map = useMapEvents({});
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 18, { duration: 1.5 });
        }
    }, [coords, map]);
    return null;
}

// Fix for Map not sizing correctly in hidden tabs
function MapUpdater() {
    const map = useMapEvents({});
    useEffect(() => {
        if (map) map.invalidateSize();
    }, [map]);
    return null;
}

// Helper to fetch user phone
const fetchUserPhone = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('phone_number').eq('id', userId).single();
    return data?.phone_number || '';
};

const ShopOnboarding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch existing phone
    useEffect(() => {
        if (user) {
            fetchUserPhone(user.id).then(phone => {
                if (phone) setBasicInfo(prev => ({ ...prev, phoneNumber: phone }));
            });
        }
    }, [user]);

    // Steps: 0=Basic, 1=Location, 2=Visuals, 3=Services
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [basicInfo, setBasicInfo] = useState({
        name: location.state?.initialShopName || '',
        type: 'Grooming',
        phoneNumber: '', // Added phone
        description: ''
    });

    const [locInfo, setLocInfo] = useState({
        city: '',
        state: '',
        country: '',
        coords: null as { lat: number, lng: number } | null
    });

    // Add Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

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
                alert('Address not found. Try a different query.');
            }
        } catch (err) {
            console.error(err);
            alert('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const [images, setImages] = useState({
        logo: null as string | null, // Base64
        gallery: [] as { file: File, preview: string }[]
    });

    const [services, setServices] = useState<{ name: string, price: number, duration: number }[]>([]);
    const [newService, setNewService] = useState({ name: '', price: 0, duration: 30 });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Handlers
    const handleBasicChange = (field: string, value: string) => setBasicInfo(prev => ({ ...prev, [field]: value }));
    const handleLocChange = (field: string, value: string) => setLocInfo(prev => ({ ...prev, [field]: value }));

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
                preview: URL.createObjectURL(file)
            }));
            setImages(prev => ({ ...prev, gallery: [...prev.gallery, ...newImages] }));
        }
    };

    const removeGalleryImage = (index: number) => {
        setImages(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
    };

    const addService = () => {
        if (newService.name) {
            setServices(prev => [...prev, newService]);
            setNewService({ name: '', price: 0, duration: 30 });
        }
    };

    const removeService = (index: number) => {
        setServices(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (!basicInfo.phoneNumber.trim()) return alert("Owner phone number is required.");

        setLoading(true);

        try {
            // 0. Update User Profile Phone if changed
            await supabase.from('profiles').update({ phone_number: basicInfo.phoneNumber }).eq('id', user.id);
            // 1. Upload Logo
            let logoUrl = null;
            if (images.logo) {
                const blob = storageService.base64ToBlob(images.logo);
                logoUrl = await storageService.uploadShopImage(blob, user.id);
            }

            // 2. Insert Shop
            const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .insert({
                    owner_id: user.id,
                    name: basicInfo.name,
                    description: basicInfo.description,
                    shop_type: basicInfo.type,
                    city: locInfo.city,
                    state: locInfo.state,
                    country: locInfo.country,
                    location: `${locInfo.city}, ${locInfo.state}, ${locInfo.country}`, // Legacy field fallback
                    latitude: locInfo.coords?.lat,
                    longitude: locInfo.coords?.lng,
                    image_url: logoUrl,
                    status: 'pending'
                })
                .select()
                .single();

            if (shopError) throw shopError;
            if (!shopData) throw new Error('No shop data returned');

            const shopId = shopData.id;

            // 3. Upload Gallery Images
            if (images.gallery.length > 0) {
                for (let i = 0; i < images.gallery.length; i++) {
                    const imgUrl = await storageService.uploadShopGalleryImage(images.gallery[i].file, user.id);
                    await supabase.from('shop_images').insert({
                        shop_id: shopId,
                        image_url: imgUrl,
                        display_order: i
                    });
                }
            }

            // 4. Insert Services
            if (services.length > 0) {
                const servicesPayload = services.map(s => ({
                    shop_id: shopId,
                    name: s.name,
                    price: s.price,
                    duration_minutes: s.duration
                }));
                const { error: svcError } = await supabase.from('services').insert(servicesPayload);
                if (svcError) console.error('Error inserting services:', svcError); // Non-blocking
            }

            navigate('/shop/dashboard');

        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Basic Details', icon: <Tag /> },
        { label: 'Location', icon: <MapPin /> },
        { label: 'Visuals', icon: <Camera /> },
        { label: 'Services', icon: <Storefront /> },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Setup your Business</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                        {steps.map((s, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: i === step ? 1 : 0.5 }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i <= step ? 'var(--primary-600)' : '#e2e8f0', color: i <= step ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {i < step ? <Check weight="bold" /> : i + 1}
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '2rem' }}>
                    {/* Step 0: Basic Info */}
                    {step === 0 && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Shop Name</label>
                                <input value={basicInfo.name} onChange={e => handleBasicChange('name', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="e.g. Paws & Claws" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Owner Phone Number <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    value={basicInfo.phoneNumber}
                                    onChange={e => handleBasicChange('phoneNumber', e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    placeholder="+1 234 567 8900"
                                    type="tel"
                                />
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Clients will use this to contact you.</div>
                            </div>
                            <div>
                                <Select
                                    label="Business Type"
                                    value={basicInfo.type}
                                    onChange={(val) => handleBasicChange('type', val)}
                                    options={[
                                        { label: 'Grooming Salon', value: 'Grooming' },
                                        { label: 'Veterinary Clinic', value: 'Vet' },
                                        { label: 'Training Center', value: 'Training' },
                                        { label: 'Boarding & Daycare', value: 'Boarding' }
                                    ]}
                                    fullWidth
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
                                <textarea rows={4} value={basicInfo.description} onChange={e => handleBasicChange('description', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Tell us about your services..." />
                            </div>
                        </div>
                    )}

                    {/* Step 1: Location */}
                    {step === 1 && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>City</label>
                                    <input value={locInfo.city} onChange={e => handleLocChange('city', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>State</label>
                                    <input value={locInfo.state} onChange={e => handleLocChange('state', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Country</label>
                                <input value={locInfo.country} onChange={e => handleLocChange('country', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Pin Location on Map</label>

                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        placeholder="Search street address (e.g. 123 Main St, New York)"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <Button size="sm" variant="primary" onClick={handleAddressSearch} loading={searching}>
                                        Search
                                    </Button>
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

                                    {/* Overlay Helper */}
                                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center', zIndex: 1000, pointerEvents: 'none' }}>
                                        Click map to pin
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <Button size="sm" variant="outline" onClick={(e) => {
                                        e.preventDefault();
                                        setLoading(true); // Re-use loading state or add a specific one if prefered, but for now simple feedback
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
                                                    // Silently fail or alert user? Alerting might be annoying if just the auto-fill fails but coords work.
                                                } finally {
                                                    setLoading(false);
                                                }
                                            },
                                            () => {
                                                alert('Could not get location. Ensure GPS is enabled.');
                                                setLoading(false);
                                            },
                                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                                        );
                                    }}>
                                        <MapPin style={{ marginRight: '0.5rem' }} /> Use My Current Location (High Accuracy)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Visuals */}
                    {step === 2 && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Logo */}
                            <div style={{ textAlign: 'center' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>Shop Logo</label>
                                <div onClick={() => logoInputRef.current?.click()} style={{ width: '120px', height: '120px', margin: '0 auto', borderRadius: '50%', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: images.logo ? `url(${images.logo}) center/cover` : '#f8fafc' }}>
                                    {!images.logo && <Camera size={32} color="#94a3b8" />}
                                </div>
                                <input type="file" ref={logoInputRef} onChange={handleLogoSelect} accept="image/*" style={{ display: 'none' }} />
                            </div>

                            {/* Gallery */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ fontWeight: 600 }}>Gallery Photos</label>
                                    <Button size="sm" variant="outline" onClick={() => galleryInputRef.current?.click()}>
                                        <Plus /> Add Photos
                                    </Button>
                                    <input type="file" ref={galleryInputRef} onChange={handleGallerySelect} multiple accept="image/*" style={{ display: 'none' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                    {images.gallery.map((img, idx) => (
                                        <div key={idx} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
                                            <img src={img.preview} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => removeGalleryImage(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}>
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {images.gallery.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#94a3b8' }}>
                                            <Images size={32} />
                                            <p>No gallery images added.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Services */}
                    {step === 3 && (
                        <div className="fade-in">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add your Services</h3>

                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input placeholder="Service Name (e.g. Full Grooming)" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    <input type="number" placeholder="Price (₹)" value={newService.price} onChange={e => setNewService({ ...newService, price: Number(e.target.value) })} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
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
                                        <button onClick={() => removeService(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash size={18} /></button>
                                    </div>
                                ))}
                                {services.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Add at least one service to continue.</p>}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div style={{ padding: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
                        <CaretLeft /> Back
                    </Button>

                    {step < 3 ? (
                        <Button variant="primary" onClick={() => setStep(s => Math.min(3, s + 1))}>
                            Next <CaretRight />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleSubmit} loading={loading}>
                            Complete Setup <Check weight="bold" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopOnboarding;
