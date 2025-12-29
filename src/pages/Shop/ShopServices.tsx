import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Trash, Storefront, MapPin } from '@phosphor-icons/react';

const ShopServices = () => {
    const { user } = useAuth();
    const [shop, setShop] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [shopForm, setShopForm] = useState({ name: '', location: '', description: '', image_url: '' });
    const [serviceForm, setServiceForm] = useState({ name: '', duration_minutes: 30, price: 0 });
    const [isEditingShop, setIsEditingShop] = useState(false);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        try {
            // Get Shop
            const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).single();

            if (shopData) {
                setShop(shopData);
                setShopForm(shopData);

                // Get Services
                const { data: svcData } = await supabase.from('services').select('*').eq('shop_id', shopData.id);
                if (svcData) setServices(svcData);
            } else {
                setIsEditingShop(true); // Force create
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveShop = async () => {
        const payload = {
            owner_id: user?.id,
            ...shopForm
        };

        if (shop) {
            const { error } = await supabase.from('shops').update(payload).eq('id', shop.id);
            if (!error) setIsEditingShop(false);
            else console.error('Error saving shop:', error);
        } else {
            const { data, error } = await supabase.from('shops').insert(payload).select().single();
            if (data) {
                setShop(data);
                setIsEditingShop(false);
            }
            if (error) console.error('Error creating shop:', error);
        }
    };

    const handleAddService = async () => {
        if (!shop) return;
        const { data, error } = await supabase.from('services').insert({
            shop_id: shop.id,
            ...serviceForm
        }).select().single();

        if (data) {
            setServices(prev => [...prev, data]);
            setServiceForm({ name: '', duration_minutes: 30, price: 0 }); // Reset
        }
        if (error) console.error('Error adding service:', error);
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm("Delete service?")) return;
        await supabase.from('services').delete().eq('id', id);
        setServices(prev => prev.filter(s => s.id !== id));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Shop Services</h1>
                <p style={{ color: '#64748b' }}>Manage your shop profile and services offered.</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* 1. Shop Profile Section */}
                <Card padding="xl">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Storefront size={24} /> Shop Details
                        </h3>
                        {!isEditingShop && <Button size="sm" variant="outline" onClick={() => setIsEditingShop(true)}>Edit Profile</Button>}
                    </div>

                    {isEditingShop ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Shop Name</label>
                                <input
                                    value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Location</label>
                                <input
                                    value={shopForm.location} onChange={e => setShopForm({ ...shopForm, location: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Bio</label>
                                <textarea
                                    value={shopForm.description} onChange={e => setShopForm({ ...shopForm, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <Button variant="primary" onClick={handleSaveShop}>Save Details</Button>
                        </div>
                    ) : (
                        <div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{shop.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', margin: '0.5rem 0' }}>
                                <MapPin size={18} /> {shop.location}
                            </div>
                            <p style={{ color: '#64748b' }}>{shop.description}</p>
                        </div>
                    )}
                </Card>

                {/* 2. Services List */}
                {shop && (
                    <Card padding="xl">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Services Menu</h3>

                        {/* Add Service Form */}
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '2rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Service</h4>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div style={{ flex: 2, minWidth: '200px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Service Name</label>
                                    <input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="e.g. Grooming" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: '100px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Price ($)</label>
                                    <input type="number" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: '100px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Duration (min)</label>
                                    <input type="number" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }} />
                                </div>
                                <Button onClick={handleAddService} variant="primary">Add</Button>
                            </div>
                        </div>

                        {/* List */}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {services.map(svc => (
                                <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{svc.name}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{svc.duration_minutes} mins • ${svc.price}</div>
                                    </div>
                                    <button onClick={() => handleDeleteService(svc.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash size={18} />
                                    </button>
                                </div>
                            ))}
                            {services.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No services added yet.</p>}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ShopServices;
