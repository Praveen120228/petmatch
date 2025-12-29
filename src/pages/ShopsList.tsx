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

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
                    Find the Best Care for Your Pet
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                    Browse top-rated local veterinarians, groomers, and pet daycares.
                </p>
            </div>

            {/* Search Bar */}
            <div style={{ maxWidth: '600px', margin: '0 auto 3rem auto', position: 'relative' }}>
                <MagnifyingGlass size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text"
                    placeholder="Search by name, service, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        borderRadius: '99px',
                        border: '1px solid #e2e8f0',
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                />
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
                            <Card className="hover-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* Image Placeholder - In real app, verify image_url exists and load it */}
                                <div style={{
                                    height: '200px',
                                    background: shop.image_url ? `url(${shop.image_url}) center/cover` : '#e2e8f0',
                                    borderRadius: '12px',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {!shop.image_url && <Storefront size={48} color="#94a3b8" weight="duotone" />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>{shop.name}</h3>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                        <MapPin size={16} weight="fill" />
                                        <span>{shop.location || 'Location not specified'}</span>
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
