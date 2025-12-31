import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { MapPin, Storefront, MagnifyingGlass, Star } from '@phosphor-icons/react';

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
                padding: '6rem 1rem 4rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.5rem 1rem',
                    borderRadius: '99px',
                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.1)',
                    marginBottom: '1.5rem',
                    color: 'var(--primary-600)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    border: '1px solid var(--primary-100)'
                }}>
                    <Storefront size={16} weight="fill" />
                    <span>Pet Services Directory</span>
                </div>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 800,
                    color: 'var(--gray-900)',
                    marginBottom: '1rem',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em'
                }}>
                    Find the Perfect <span className="text-gradient">Care</span><br />for Your Pet
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--gray-600)',
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    Connect with top-rated local veterinarians, groomers, and pet daycares bonded by trust.
                </p>
            </div>

            {/* Glass Search Bar */}
            <div style={{ maxWidth: '700px', margin: '-5rem auto 4rem auto', position: 'relative', zIndex: 10, padding: '0 1rem' }}>
                <div style={{
                    position: 'relative',
                    borderRadius: '99px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                }}>
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
                            border: 'none',
                            background: 'transparent',
                            fontSize: '1.1rem',
                            outline: 'none',
                            color: 'var(--gray-900)'
                        }}
                    />
                </div>
            </div>

            {/* Shops Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="pulse-animation" style={{ fontSize: '1.5rem', color: 'var(--primary-400)' }}>Loading premium services...</div>
                </div>
            ) : filteredShops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-500)' }}>
                    <Storefront size={48} weight="duotone" style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--primary-300)' }} />
                    <p style={{ fontSize: '1.1rem' }}>No shops found matching your search.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', paddingBottom: '4rem' }}>
                    {filteredShops.map(shop => (
                        <Link key={shop.id} to={`/shops/${shop.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="glass-panel card-hover" style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1rem'
                            }}>
                                {/* Image Placeholder */}
                                <div style={{
                                    height: '220px',
                                    background: shop.image_url ? `url(${shop.image_url}) center/cover` : 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                                    borderRadius: '16px',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {!shop.image_url && <Storefront size={48} color="var(--primary-200)" weight="duotone" />}

                                    {/* Mock Rating Badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'rgba(255,255,255,0.9)',
                                        borderRadius: '8px',
                                        padding: '4px 8px',
                                        fontSize: '0.875rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: '#111827'
                                    }}>
                                        <Star weight="fill" color="#fbbf24" /> 4.9
                                    </div>
                                </div>

                                <div style={{ flex: 1, padding: '0 0.5rem' }}>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>{shop.name}</h3>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                                        <MapPin size={18} weight="fill" color="var(--primary-400)" />
                                        <span>{shop.location || [shop.city, shop.state].filter(Boolean).join(', ') || 'Location not specified'}</span>
                                    </div>

                                    <p style={{
                                        color: 'var(--gray-600)',
                                        fontSize: '1rem',
                                        lineHeight: 1.6,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        marginBottom: '1rem'
                                    }}>
                                        {shop.description || 'Professional pet care services.'}
                                    </p>
                                </div>
                                <div style={{
                                    marginTop: 'auto',
                                    padding: '1rem 0.5rem 0.5rem',
                                    borderTop: '1px solid var(--primary-100)',
                                    color: 'var(--primary-600)',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    View Services <span style={{ transition: 'transform 0.2s', display: 'inline-block' }}>&rarr;</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShopsList;
