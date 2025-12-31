import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeSlash, Trash, PawPrint, Funnel } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Card from '../../components/Card';

const AdminPets = () => {
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('pets')
                .select('*, owner_id, profiles(email, name)') // Join profile if possible, though owner_id is on pet
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

    useEffect(() => {
        fetchPets();
    }, [filter]);

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
                        <Card key={pet.id} padding="none" style={{ overflow: 'hidden', position: 'relative' }}>
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
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', height: '2.5rem', overflow: 'hidden' }}>
                                    {pet.bio || 'No bio provided...'}
                                </p>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    {pet.status !== 'hidden' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            fullWidth
                                            onClick={() => handleStatusUpdate(pet.id, 'hidden')}
                                            disabled={!!processingId}
                                            style={{ color: '#d97706', borderColor: '#d97706' }}
                                        >
                                            <EyeSlash /> Hide
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            fullWidth
                                            onClick={() => handleStatusUpdate(pet.id, 'available')}
                                            disabled={!!processingId}
                                        >
                                            <Eye /> Unhide
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(pet.id)}
                                        disabled={!!processingId}
                                        style={{ color: '#ef4444' }}
                                    >
                                        <Trash size={18} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPets;
