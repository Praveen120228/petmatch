import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MagnifyingGlass, PawPrint, Faders } from '@phosphor-icons/react';
import Card from '../components/Card';
import Button from '../components/Button';
import { featureService } from '../lib/featureService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { petService } from '../lib/petService';
import { PET_TYPES } from '../data/breeds';

const AGES = ['1 yr', '2 yrs', '3 yrs', '4 yrs', '5 yrs'];

const MatchFeed = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // State
    const [allPets, setAllPets] = useState<any[]>([]);
    const [likes, setLikes] = useState<number[]>([]);
    // const [loading, setLoading] = useState(true); // unused

    // const [tick, setTick] = useState(0); // unused
    // const [currentPetIndex, setCurrentPetIndex] = useState(0); // unused
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    // const [direction, setDirection] = useState<'left' | 'right' | null>(null); // unused

    // Filter Controls
    const [showFilters, setShowFilters] = useState(false);
    // const [filterType, setFilterType] = useState('All'); // unused
    // const [maxDistance, setMaxDistance] = useState(50); // unused

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
    const [selectedAges, setSelectedAges] = useState<string[]>([]);

    // 1. Fetch Pets & Likes
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            // setLoading(true); 
            const [pets, userLikes] = await Promise.all([
                petService.getAllPets(user.id),
                featureService.getLikes(user.id)
            ]);
            setAllPets(pets);
            setLikes(userLikes);
            // setLoading(false);
        };
        loadData();
    }, [user]);

    // 44. Derived Filter Options
    const availableBreeds = useMemo(() => {
        const petsToConsider = selectedType === 'all' ? allPets : allPets.filter(p => p.type === selectedType);
        return [...new Set(petsToConsider.map(p => p.breed))];
    }, [selectedType, allPets]);

    // 47. Filter Logic
    const filteredPets = useMemo(() => {
        // use 'pets' (the combined list) or 'allPets' (fetched)?
        // Previous code combined mock + local in 'pets' memo.
        // But we are now fetching allPets via service which returns mixed.
        // So just use allPets.

        return allPets.filter(pet => {
            // Search
            const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pet.breed.toLowerCase().includes(searchQuery.toLowerCase());

            // Type
            const matchesType = selectedType === 'all' || pet.type === selectedType;

            // Breed
            const matchesBreed = selectedBreeds.length === 0 || selectedBreeds.includes(pet.breed);

            // Age
            const matchesAge = selectedAges.length === 0 || selectedAges.includes(pet.age);

            return matchesSearch && matchesType && matchesBreed && matchesAge;
        });
    }, [searchQuery, selectedType, selectedBreeds, selectedAges, allPets]);

    // Handlers
    const toggleBreed = (breed: string) => {
        setSelectedBreeds(prev =>
            prev.includes(breed) ? prev.filter(b => b !== breed) : [...prev, breed]
        );
    };

    const toggleAge = (age: string) => {
        setSelectedAges(prev =>
            prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        setSelectedBreeds([]);
        setSelectedAges([]);
        showToast('Filters cleared', 'info');
    };

    const handleLike = async (e: React.MouseEvent, pet: any) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            showToast("Please login to like pets", "error");
            return;
        }

        // Optimistic UI update
        const alreadyLiked = likes.includes(pet.id);
        const newLikes = alreadyLiked
            ? likes.filter(id => id !== pet.id)
            : [...likes, pet.id];

        setLikes(newLikes); // Update UI immediately

        try {
            const isLiked = await featureService.toggleLike(user.id, pet.id);
            if (isLiked) {
                showToast(`You liked ${pet.name}!`, 'success');
            }
        } catch (err) {
            console.error(err);
            // Revert on error
            setLikes(likes);
            showToast("Failed to update like", "error");
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)', display: 'flex', flexDirection: 'column' }}>

            {/* Top Search Bar (Global) */}
            <div style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', position: 'sticky', top: 73, zIndex: 30 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>

                    {/* Toggle Sidebar Button */}
                    <Button
                        variant={showFilters ? 'secondary' : 'ghost'}
                        size="md"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ border: '1px solid var(--color-border)', minWidth: '110px', justifyContent: 'center' }}
                    >
                        <Faders size={20} weight={showFilters ? 'fill' : 'regular'} />
                        Filters
                    </Button>

                    {/* Search Input */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                        <MagnifyingGlass
                            size={20}
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search by name, breed, or trait..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.75rem',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: 'var(--color-bg-subtle)',
                                color: 'var(--color-text-primary)',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.borderColor = 'var(--primary-400)';
                                e.target.style.boxShadow = '0 0 0 2px var(--primary-100)';
                            }}
                            onBlur={(e) => {
                                e.target.style.background = 'var(--color-bg-subtle)';
                                e.target.style.borderColor = 'var(--color-border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1, position: 'relative' }}>

                {/* Sidebar Filters */}
                <aside style={{
                    width: showFilters ? '300px' : '0px',
                    opacity: showFilters ? 1 : 0,
                    marginRight: showFilters ? '0' : '-1px', // Hide border artifact
                    background: 'var(--color-bg-card)',
                    borderRight: '1px solid var(--color-border)',
                    height: 'calc(100vh - 145px)', // Fixed height for scrolling
                    position: 'sticky',
                    top: '145px', // Below filter bar (73+72)
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    <div style={{ width: '300px', flexShrink: 0 }}> {/* Fixed width container */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Filters</h2>
                            {(selectedType !== 'all' || selectedBreeds.length > 0 || selectedAges.length > 0) && (
                                <button onClick={clearFilters} style={{ fontSize: '0.875rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>CLEAR ALL</button>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto' }}>
                            {/* Categories */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Pet Type</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {[{ id: 'all', label: 'All Types' }, ...PET_TYPES].map((type) => (
                                        <label key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: selectedType === type.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                            <input
                                                type="radio"
                                                name="petType"
                                                checked={selectedType === type.id}
                                                onChange={() => { setSelectedType(type.id); setSelectedBreeds([]); }}
                                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-600)' }}
                                            />
                                            {type.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Age */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Age</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {AGES.map((age) => (
                                        <button
                                            key={age}
                                            onClick={() => toggleAge(age)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 'var(--radius-full)',
                                                border: `1px solid ${selectedAges.includes(age) ? 'var(--primary-600)' : 'var(--color-border)'}`,
                                                background: selectedAges.includes(age) ? 'var(--primary-50)' : 'white',
                                                color: selectedAges.includes(age) ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Breed */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Breed</h3>
                                {selectedType === 'all' ? (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Select a category to filter breeds</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {availableBreeds.map(breed => (
                                            <label key={breed} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBreeds.includes(breed)}
                                                    onChange={() => toggleBreed(breed)}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-600)', borderRadius: '4px' }}
                                                />
                                                {breed}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Grid */}
                <main style={{ flex: 1, padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                            {filteredPets.length} <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>pets nearby</span>
                        </h1>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {filteredPets.length > 0 ? (
                            filteredPets.map(pet => (
                                <div key={pet.id} onMouseEnter={() => setHoveredId(pet.id)} onMouseLeave={() => setHoveredId(null)}>
                                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                        <Card
                                            padding="0"
                                            style={{
                                                aspectRatio: '4/5',
                                                borderRadius: '20px',
                                                border: 'none',
                                                boxShadow: 'var(--shadow-md)',
                                            }}
                                        >
                                            <Link to={`/pet/${pet.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                                <img
                                                    src={pet.image}
                                                    alt={pet.name}
                                                    loading="lazy"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: hoveredId === pet.id ? 'scale(1.05)' : 'scale(1)' }}
                                                />
                                            </Link>

                                            {/* Gradient Overlay */}
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
                                                pointerEvents: 'none'
                                            }} />

                                            {/* Like Button Overlay */}
                                            <Button
                                                onClick={(e) => handleLike(e, pet)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    width: '40px',
                                                    height: '40px',
                                                    padding: 0,
                                                    boxShadow: 'var(--shadow-md)',
                                                    zIndex: 10
                                                }}
                                            >
                                                <Heart weight="fill" color={likes.includes(pet.id) ? 'var(--secondary-500)' : 'var(--gray-300)'} size={20} />
                                            </Button>

                                            {/* Content Overlay */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '1.5rem',
                                                color: 'white'
                                            }}>
                                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{pet.name}</h3>
                                                <p style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: 500 }}>{pet.breed}, {pet.age}</p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 2rem', color: 'var(--gray-400)' }}>
                                <div style={{ background: 'var(--gray-100)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <PawPrint size={40} weight="duotone" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>No pets found</h3>
                                <p style={{ fontSize: '1.1rem' }}>Try adjusting your search or filters to see more results.</p>
                                <Button variant="outline" onClick={clearFilters} style={{ marginTop: '2rem' }}>Clear All Filters</Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MatchFeed;
