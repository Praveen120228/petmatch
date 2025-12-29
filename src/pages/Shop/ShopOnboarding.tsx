import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Storefront, MapPin, Tag } from '@phosphor-icons/react';

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
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // Insert Shop
            const { error } = await supabase
                .from('shops')
                .insert({
                    owner_id: user.id,
                    name: shopName,
                    description: description,
                    location: city, // Mapping city to location for now, or use full address
                    city: city, // New column
                    shop_type: shopType, // New column
                    status: 'pending' // New column
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

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                            <MapPin size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            City / Location
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Hyderabad, India"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                        />
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

                    <Button type="submit" size="lg" variant="primary" loading={loading} style={{ background: '#16a34a', borderColor: '#16a34a', marginTop: '1rem' }}>
                        Complete Setup
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ShopOnboarding;
