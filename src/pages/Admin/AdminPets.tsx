import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeSlash, Trash, PawPrint, Funnel, X, User, ChartLineUp } from '@phosphor-icons/react';
import Button from '../../components/Button';
import PaginationControls from '../../components/PaginationControls';
import { MagnifyingGlass } from '@phosphor-icons/react';

const PAGE_SIZE = 12;

const AdminPets = () => {
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedPet, setSelectedPet] = useState<any | null>(null);
    const [petAnalytics, setPetAnalytics] = useState<{ views: number, loading: boolean }>({ views: 0, loading: false });

    const fetchPets = async () => {
        setLoading(true);
        try {
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('pets')
                .select('*, profiles!pets_owner_id_fkey(id, email, name, avatar_url, username)', { count: 'exact' }) // Join profile explicitly with more fields
                .order('created_at', { ascending: false })
                .range(from, to);

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            if (search) {
                // Search across pet details and owner details
                // Note: referencing foreign table columns in OR requires the table name (profiles)
                query = query.or(`name.ilike.%${search}%,breed.ilike.%${search}%,type.ilike.%${search}%,profiles.name.ilike.%${search}%,profiles.username.ilike.%${search}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;
            setPets(data || []);
            setTotalCount(count || 0);
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


            // Actually, let's update call site to pass public_id
            // For now, let's assume the argument passed IS the identifier used in URL. 
            // In AdminPets, we will change the call to pass public_id.
            const queryPath = `/pet/${petId}`;

            const { count, error } = await supabase
                .from('analytics_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'page_view')
                .contains('payload', { path: queryPath }); // JSONB containment for path

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
    }, [filter, page]);

    // Reset page on search or filter change (debounce search)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (page === 1) fetchPets();
            else setPage(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        if (selectedPet) {
            fetchPetAnalytics(selectedPet.public_id || selectedPet.id);
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
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>Moderate Pets</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
                        <MagnifyingGlass
                            size={20}
                            color="#94a3b8"
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search pets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2dd4bf'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Funnel size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                appearance: 'none',
                                padding: '0.6rem 2.5rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                cursor: 'pointer',
                                outline: 'none',
                                fontSize: '0.9rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                minWidth: '160px'
                            }}
                        >
                            <option value="all">All Pets</option>
                            <option value="available">Available</option>
                            <option value="hidden">Hidden</option>
                            <option value="adopted">Adopted</option>
                        </select>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="#94a3b8"
                            viewBox="0 0 256 256"
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                        </svg>
                    </div>
                    <Button variant="outline" onClick={fetchPets} disabled={loading} style={{ borderColor: '#334155', color: '#94a3b8', background: '#1e293b' }}>Refresh</Button>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8' }}>Loading pets...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                        {pets.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                                <PawPrint size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                <p>No pets found.</p>
                            </div>
                        )}

                        {pets.map(pet => (
                            <div key={pet.id} style={{
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                border: selectedPet?.id === pet.id ? '2px solid #2dd4bf' : '1px solid #334155',
                                background: '#1e293b',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }} onClick={() => setSelectedPet(pet)}>
                                <div style={{ height: '200px', background: '#0f172a', position: 'relative' }}>
                                    {pet.image ? (
                                        <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <PawPrint size={48} color="#334155" />
                                        </div>
                                    )}
                                    {pet.status === 'hidden' && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, letterSpacing: '0.1em' }}>
                                            HIDDEN
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                        <span style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {pet.status?.toUpperCase() || 'AVAILABLE'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'white' }}>{pet.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{pet.breed}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#334155', overflow: 'hidden', border: '1px solid #475569' }}>
                                            {pet.profiles?.avatar_url ? (
                                                <img src={pet.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={14} style={{ margin: '4px' }} color="#94a3b8" />
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pet.profiles?.name || pet.profiles?.email || 'Unknown Owner'}</span>
                                    </div>

                                    <Button size="sm" variant="outline" fullWidth style={{ marginTop: 'auto', borderColor: '#334155', color: '#94a3b8' }}>
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <PaginationControls
                        currentPage={page}
                        totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                        onPageChange={setPage}
                        hasNext={page * PAGE_SIZE < totalCount}
                        hasPrev={page > 1}
                        loading={loading}
                        totalItems={totalCount}
                        style={{ marginTop: '1.5rem', color: '#94a3b8', background: 'transparent', borderTop: '1px solid #334155' }}
                    />
                </div>
            )}

            {/* Detailed Modal */}
            {selectedPet && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setSelectedPet(null)}>
                    <div style={{
                        background: '#1e293b', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: '16px', padding: '0', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid #334155'
                    }} onClick={e => e.stopPropagation()}>

                        <button
                            onClick={() => setSelectedPet(null)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                                background: '#334155', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', color: 'white'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '0' }}>
                            {/* Left: Image */}
                            <div style={{ background: '#0f172a', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedPet.image ? (
                                    <img src={selectedPet.image} alt={selectedPet.name} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                                ) : (
                                    <PawPrint size={96} color="#334155" />
                                )}
                            </div>

                            {/* Right: Details */}
                            <div style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>{selectedPet.name}</h2>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', background: '#334155', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {selectedPet.breed}
                                        </span>
                                        <span style={{ padding: '0.25rem 0.75rem', background: '#334155', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {selectedPet.age}
                                        </span>
                                        <span style={{ padding: '0.25rem 0.75rem', background: '#334155', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {selectedPet.gender}
                                        </span>
                                    </div>
                                </div>

                                {/* Analytics Section */}
                                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ChartLineUp weight="bold" /> Performance Analytics
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                        {petAnalytics.loading ? (
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8' }}>...</span>
                                        ) : (
                                            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{petAnalytics.views.toLocaleString()}</span>
                                        )}
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Total Views</span>
                                    </div>
                                </div>

                                {/* Owner Info */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid #334155', borderRadius: '8px', background: '#0f172a' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#334155', overflow: 'hidden' }}>
                                            {selectedPet.profiles?.avatar_url ? (
                                                <img src={selectedPet.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={24} style={{ margin: '12px' }} color="#94a3b8" />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'white' }}>{selectedPet.profiles?.name || 'Unnamed User'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{selectedPet.profiles?.email}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</h4>
                                    <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{selectedPet.bio || 'No bio provided for this pet.'}</p>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                                    {selectedPet.status !== 'hidden' ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleStatusUpdate(selectedPet.id, 'hidden')}
                                            loading={processingId === selectedPet.id}
                                            style={{ color: '#fbbf24', borderColor: '#fbbf24', background: 'transparent' }}
                                        >
                                            <EyeSlash /> Hide Pet
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            onClick={() => handleStatusUpdate(selectedPet.id, 'available')}
                                            loading={processingId === selectedPet.id}
                                            style={{ background: '#2dd4bf', borderColor: '#2dd4bf', color: '#0f172a' }}
                                        >
                                            <Eye /> Unhide Pet
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDelete(selectedPet.id)}
                                        loading={processingId === selectedPet.id}
                                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                                    >
                                        <Trash /> Delete
                                    </Button>
                                </div>

                            </div>
                        </div>
                        <style>{`
                            @media (max-width: 768px) {
                                div[style*="grid-template-columns: minmax(300px, 1fr) 1fr"] {
                                    grid-template-columns: 1fr !important;
                                }
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPets;
