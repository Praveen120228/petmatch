import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Storefront, MapPin, Tag, Camera, Globe, MapTrifold } from '@phosphor-icons/react';
import { storageService } from '../../lib/storageService';

const ShopOnboarding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Initial State from registration if available
    const initialShopName = location.state?.initialShopName || '';

    const [loading, setLoading] = useState(false);
    const [shopName, setShopName] = useState(initialShopName);
    const [shopType, setShopType] = useState('Grooming');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [description, setDescription] = useState('');
    const [shopImage, setShopImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setShopImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            let imageUrl = null;
            if (shopImage && shopImage.startsWith('data:')) {
                const blob = storageService.base64ToBlob(shopImage);
                imageUrl = await storageService.uploadShopImage(blob, user.id);
            }

            // Insert Shop
            const { error } = await supabase
                .from('shops')
                .insert({
                    owner_id: user.id,
                    name: shopName,
                    description: description,
                    location: `${city}, ${state}, ${country}`,
                    city: city,
                    state: state,
                    country: country,
                    shop_type: shopType,
                    status: 'pending',
                    image_url: imageUrl
                });

            if (error) throw error;

            // Success -> Go to Dashboard
            navigate('/shop/dashboard');

        } catch (error) {
            console.error('Error creating shop:', error);
            alert('Failed to set up shop. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', background: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '600px', background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>Setup your Business</h2>
                    <p style={{ color: '#6b7280' }}>Tell us a bit about your shop to get started.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Image Upload */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '120px', height: '120px', borderRadius: '50%',
                                border: '2px dashed #d1d5db',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                background: shopImage ? `url(${shopImage}) center/cover` : '#f9fafb'
                            }}
                        >
                            {!shopImage && (
                                <>
                                    <Camera size={32} color="#9ca3af" />
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Add Logo</span>
                                </>
                            )}
                            {shopImage && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: 0, transition: 'opacity 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                >
                                    <Camera size={32} color="white" />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                            <Storefront size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Shop Name
                        </label>
                        <input
                            type="text"
                            required
                            value={shopName}
                            onChange={e => setShopName(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                            <Tag size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Business Type
                        </label>
                        <select
                            value={shopType}
                            onChange={e => setShopType(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', background: 'white' }}
                        >
                            <option value="Grooming">Grooming Salon</option>
                            <option value="Vet">Veterinary Clinic</option>
                            <option value="Training">Pet Training</option>
                            <option value="Boarding">Pet Boarding</option>
                            <option value="Daycare">Pet Daycare</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                                <MapPin size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                City
                            </label>
                            <input
                                type="text"
                                required
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                                <MapTrifold size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                State
                            </label>
                            <input
                                type="text"
                                required
                                value={state}
                                onChange={e => setState(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                                <Globe size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                Country
                            </label>
                            <input
                                type="text"
                                required
                                value={country}
                                onChange={e => setCountry(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                        />
                    </div>

                    <Button type="submit" size="lg" variant="primary" loading={loading} fullWidth>
                        Complete Setup
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ShopOnboarding;
