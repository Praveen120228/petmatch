import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeSlash, Trash, PawPrint, Funnel, X, User, ChartLineUp } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';

const AdminPets = () => {
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedPet, setSelectedPet] = useState<any | null>(null);
    const [petAnalytics, setPetAnalytics] = useState<{ views: number, loading: boolean }>({ views: 0, loading: false });

    const fetchPets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('pets')
                .select('*, profiles!pets_owner_id_fkey(id, email, name, avatar_url, username)') // Join profile explicitly with more fields
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setPets(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPetAnalytics = async (petId: any) => {
        setPetAnalytics({ views: 0, loading: true });
        try {
            // Count page views for this pet
            // Path usually '/pet/:id'
            // We use a wildcard match or specific path construction. 
            // Ideally we store resource_id in analytics, but for now we parse path.

            const path = `/pet/${petId}`;

            const { count, error } = await supabase
                .from('analytics_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'page_view')
                .contains('payload', { path: path }); // JSONB containment for path

            if (error) {
                // Fallback if containment fails (legacy data structure?)
                console.warn("Analytics fetch warning", error);
            }

            setPetAnalytics({ views: count || 0, loading: false });

        } catch (e) {
            console.error(e);
            setPetAnalytics({ views: 0, loading: false });
        }
    };

    useEffect(() => {
        fetchPets();
    }, [filter]);

    useEffect(() => {
        if (selectedPet) {
            fetchPetAnalytics(selectedPet.id);
        }
    }, [selectedPet]);


    const handleStatusUpdate = async (petId: string, status: 'available' | 'hidden') => {
        const action = status === 'hidden' ? 'HIDE' : 'UNHIDE';
        if (!confirm(`Are you sure you want to ${action} this pet?`)) return;

        setProcessingId(petId);
        try {
            const { error } = await supabase
                .from('pets')
                .update({ status })
                .eq('id', petId);

            if (error) throw error;

            setPets(prev => prev.map(p => p.id === petId ? { ...p, status } : p));
            if (selectedPet && selectedPet.id === petId) {
                setSelectedPet({ ...selectedPet, status });
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (petId: string) => {
        if (!confirm('DANGER: This will permanently DELETE this pet listing.\n\nAre you sure?')) return;

        setProcessingId(petId);
        try {
            const { error } = await supabase.from('pets').delete().eq('id', petId);
            if (error) throw error;

            setPets(prev => prev.filter(p => p.id !== petId));
            if (selectedPet && selectedPet.id === petId) {
                setSelectedPet(null);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to delete pet.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Moderate Pets</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Funnel size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#1e293b',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Pets</option>
                            <option value="available">Available</option>
                            <option value="hidden">Hidden</option>
                            <option value="adopted">Adopted</option>
                        </select>
                    </div>
                    <Button variant="outline" onClick={fetchPets} disabled={loading}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div>Loading pets...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {pets.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '12px' }}>
                            <PawPrint size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <p>No pets found.</p>
                        </div>
                    )}

                    {pets.map(pet => (
                        <Card key={pet.id} padding="none" style={{ overflow: 'hidden', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s', border: selectedPet?.id === pet.id ? '2px solid #3b82f6' : 'none' }} onClick={() => setSelectedPet(pet)}>
                            <div style={{ height: '200px', background: '#f1f5f9', position: 'relative' }}>
                                {pet.image ? (
                                    <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <PawPrint size={48} color="#cbd5e1" />
                                    </div>
                                )}
                                {pet.status === 'hidden' && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, letterSpacing: '0.1em' }}>
                                        HIDDEN
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                    <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {pet.status?.toUpperCase() || 'AVAILABLE'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{pet.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pet.breed}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                        {pet.profiles?.avatar_url ? (
                                            <img src={pet.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={16} style={{ margin: '4px' }} color="#94a3b8" />
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pet.profiles?.name || pet.profiles?.email || 'Unknown Owner'}</span>
                                </div>

                                <Button size="sm" variant="outline" fullWidth style={{ marginTop: 'auto' }}>
                                    View Details
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detailed Modal */}
            {selectedPet && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setSelectedPet(null)}>
                    <div style={{
                        background: 'white', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: '16px', padding: '0', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }} onClick={e => e.stopPropagation()}>

                        <button
                            onClick={() => setSelectedPet(null)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                                background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                            {/* Left: Image */}
                            <div style={{ background: '#f8fafc', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedPet.image ? (
                                    <img src={selectedPet.image} alt={selectedPet.name} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                                ) : (
                                    <PawPrint size={96} color="#cbd5e1" />
                                )}
                            </div>

                            {/* Right: Details */}
                            <div style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>{selectedPet.name}</h2>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                            {selectedPet.breed}
                                        </span>
                                        <span style={{ padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                            {selectedPet.age}
                                        </span>
                                        <span style={{ padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                            {selectedPet.gender}
                                        </span>
                                    </div>
                                </div>

                                {/* Analytics Section */}
                                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ChartLineUp weight="bold" /> Performance Analytics
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                        {petAnalytics.loading ? (
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8' }}>...</span>
                                        ) : (
                                            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a' }}>{petAnalytics.views.toLocaleString()}</span>
                                        )}
                                        <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 500 }}>Total Views</span>
                                    </div>
                                </div>

                                {/* Owner Info */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                            {selectedPet.profiles?.avatar_url ? (
                                                <img src={selectedPet.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={24} style={{ margin: '12px' }} color="#94a3b8" />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedPet.profiles?.name || 'Unnamed User'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedPet.profiles?.email}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</h4>
                                    <p style={{ color: '#334155', lineHeight: '1.6' }}>{selectedPet.bio || 'No bio provided for this pet.'}</p>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                                    {selectedPet.status !== 'hidden' ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStatusUpdate(selectedPet.id, 'hidden')}
                                            loading={processingId === selectedPet.id}
                                            style={{ color: '#d97706', borderColor: '#d97706' }}
                                        >
                                            <EyeSlash /> Hide Pet
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            onClick={() => handleStatusUpdate(selectedPet.id, 'available')}
                                            loading={processingId === selectedPet.id}
                                        >
                                            <Eye /> Unhide Pet
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDelete(selectedPet.id)}
                                        loading={processingId === selectedPet.id}
                                        style={{ color: '#ef4444', background: '#fef2f2' }}
                                    >
                                        <Trash /> Delete
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPets;
