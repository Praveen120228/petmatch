import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { MapPin, Storefront, MagnifyingGlass } from '@phosphor-icons/react';
import Card from '../components/Card';
import SEO from '../components/SEO';

const ShopsList = () => {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const { data } = await supabase
                .from('shops')
                .select('*')
                .order('name');

            if (data) setShops(data);
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in page-container">
            <SEO title="Find Pet Shops & Services" description="Discover the best grooming, vet, and daycare services for your pet." />

            {/* Hero Section */}
            <div style={{
                textAlign: 'center',
                marginBottom: '4rem',
                padding: '4rem 1rem',
                background: 'linear-gradient(to bottom, var(--primary-50), rgba(255,255,255,0))',
                borderRadius: '0 0 2rem 2rem',
                margin: '-2rem -2rem 3rem -2rem'
            }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '99px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem', color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Storefront size={16} weight="fill" />
                    <span>Pet Services Directory</span>
                </div>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', lineHeight: 1.2 }}>
                    Find the Perfect <span className="text-gradient">Care</span><br />for Your Pet
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                    Connect with top-rated local veterinarians, groomers, and pet daycares bonded by trust.
                </p>
            </div>

            {/* Search Bar */}
            <div style={{ maxWidth: '700px', margin: '-5rem auto 4rem auto', position: 'relative', zIndex: 10, padding: '0 1rem' }}>
                <div style={{ position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', borderRadius: '99px', background: 'white' }}>
                    <MagnifyingGlass size={24} color="var(--primary-400)" style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search for grooming, vet, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1.25rem 1.5rem 1.25rem 4rem',
                            borderRadius: '99px',
                            border: '1px solid #e2e8f0',
                            fontSize: '1.1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-400)'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>
            </div>

            {/* Shops Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading shops...</div>
            ) : filteredShops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Storefront size={48} weight="duotone" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No shops found matching your search.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {filteredShops.map(shop => (
                        <Link key={shop.id} to={`/shops/${shop.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Card className="hover-card-rise" style={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                                {/* Image Placeholder - In real app, verify image_url exists and load it */}
                                <div style={{
                                    height: '200px',
                                    background: shop.image_url ? `url(${shop.image_url}) center/cover` : 'var(--primary-50)',
                                    borderRadius: '12px',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {!shop.image_url && <Storefront size={48} color="var(--primary-200)" weight="duotone" />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>{shop.name}</h3>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                        <MapPin size={16} weight="fill" />
                                        <span>{shop.location || [shop.city, shop.state].filter(Boolean).join(', ') || 'Location not specified'}</span>
                                    </div>

                                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {shop.description || 'No description available.'}
                                    </p>
                                </div>
                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.9rem' }}>
                                    View Services &rarr;
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShopsList;
