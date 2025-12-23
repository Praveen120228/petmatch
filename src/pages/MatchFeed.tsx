import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MagnifyingGlass, PawPrint, Faders, MapPin } from '@phosphor-icons/react';
import Card from '../components/Card';
import Button from '../components/Button';
import { featureService } from '../lib/featureService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { petService } from '../lib/petService';
import { userService } from '../lib/userService';
import { getDistance } from '../utils/distance';
import { PET_TYPES } from '../data/breeds';

const AGES = ['1 yr', '2 yrs', '3 yrs', '4 yrs', '5 yrs'];

const MatchFeed = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // State
    const [pets, setPets] = useState<any[]>([]);
    const [likes, setLikes] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);


    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // Filter Controls
    const [showFilters, setShowFilters] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
    const [selectedAges, setSelectedAges] = useState<string[]>([]);

    // Load Likes (Once)
    useEffect(() => {
        if (!user) return;
        featureService.getLikes(user.id).then(setLikes);
        userService.getProfile(user.id).then(p => {
            if (p?.latitude && p?.longitude) {
                setUserLoc({ lat: p.latitude, lng: p.longitude });
            }
        });
    }, [user]);

    // Load Pets (Paginated)
    const loadPets = async (reset = false) => {
        if (!user) return;
        setLoading(true);


        const currentPage = reset ? 1 : page;

        try {
            const { data } = await petService.getPetsPaginated(
                user.id,
                currentPage,
                20,
                {
                    type: selectedType,
                    breeds: selectedBreeds,
                    ages: selectedAges,
                    search: searchQuery
                }
            );

            if (reset) {
                setPets(data);
                setPage(2); // Next page will be 2
            } else {
                setPets(prev => {
                    // Deduplicate just in case
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPets = data.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPets];
                });
                setPage(prev => prev + 1);
            }

            // If we got fewer than requested or hit total count, no more
            setHasMore(data.length === 20);

        } catch (err) {
            console.error(err);
            showToast("Failed to load pets", "error");
        } finally {
            setLoading(false);
        }
    };

    // Trigger load when filters change
    useEffect(() => {
        // Debounce search slightly if typing fast, but for now simple effect
        const timer = setTimeout(() => {
            loadPets(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [user, selectedType, selectedBreeds, selectedAges, searchQuery]);

    // Derived Filter Options (Breeds)
    // Note: Ideally fetching available breeds from server would be better than just from loaded pets
    // But for now, we leave as is or simplify. 
    // If we only show breeds from loaded pets, the filter list shrinks.
    // Let's assume for now we don't strictly enforce "available" breeds validation in UI or we use static if possible.
    // The current UI derives from 'allPets' (which is now 'pets'). 
    // This means you can only filter by breeds you see. This is a common pattern in infinite scroll with client-side derived facets.
    const availableBreeds = useMemo(() => {
        // We can just show breeds from ALL currently loaded pets
        return [...new Set(pets.map(p => p.breed))];
    }, [pets]);

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
            <div style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', padding: '1rem', position: 'sticky', top: 72, zIndex: 30 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>

                    {/* Toggle Sidebar Button */}
                    <Button
                        variant={showFilters ? 'secondary' : 'ghost'}
                        size="md"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ border: '1px solid var(--color-border)', minWidth: '100px', justifyContent: 'center' }}
                    >
                        <Faders size={20} weight={showFilters ? 'fill' : 'regular'} />
                        <span className="hide-on-mobile">Filters</span>
                    </Button>

                    {/* Search Input */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                        <MagnifyingGlass
                            size={20}
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.75rem',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--color-border)',
                                fontSize: '16px', // Mobile friendly
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

                {/* Filters - Sidebar on Desktop, Full Overlay on Mobile */}
                <aside style={{
                    position: window.innerWidth <= 768 ? 'fixed' : 'sticky',
                    top: window.innerWidth <= 768 ? '72px' : '145px', // Below nav
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 40,
                    background: 'var(--color-bg-card)',
                    width: window.innerWidth <= 768 ? '100%' : (showFilters ? '300px' : '0px'),
                    opacity: showFilters ? 1 : 0,
                    pointerEvents: showFilters ? 'auto' : 'none',
                    borderRight: '1px solid var(--color-border)',
                    height: window.innerWidth <= 768 ? 'calc(100vh - 72px)' : 'calc(100vh - 145px)',
                    overflowY: 'auto',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ width: window.innerWidth <= 768 ? '100%' : '300px', flexShrink: 0 }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Filters</h2>
                            {(selectedType !== 'all' || selectedBreeds.length > 0 || selectedAges.length > 0) && (
                                <button onClick={clearFilters} style={{ fontSize: '0.875rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>CLEAR</button>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                        {/* Mobile Apply Button */}
                        {window.innerWidth <= 768 && (
                            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                                <Button fullWidth onClick={() => setShowFilters(false)} variant="primary">View {pets.length} Results</Button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Grid */}
                <main style={{ flex: 1, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                            {pets.length} <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>pets</span>
                        </h1>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', // Optimized for 3:4 card (240px width)
                        gap: '1rem',
                        paddingBottom: '2rem'
                    }}>
                        {pets.length > 0 ? (
                            <>
                                {pets.map(pet => (
                                    <div key={pet.id} onMouseEnter={() => setHoveredId(pet.id)} onMouseLeave={() => setHoveredId(null)} style={{ height: '320px', width: '240px', margin: '0 auto' }}>
                                        <Card
                                            padding="0"
                                            style={{
                                                borderRadius: '24px',
                                                border: 'none',
                                                boxShadow: hoveredId === pet.id ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                                                transition: 'all 0.3s ease',
                                                transform: hoveredId === pet.id ? 'translateY(-4px)' : 'none',
                                                overflow: 'hidden',
                                                background: 'var(--gray-900)',
                                                height: '100%',
                                                position: 'relative',
                                                display: 'block'
                                            }}
                                        >
                                            <Link to={`/pet/${pet.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                                {/* Full Height Image */}
                                                <img
                                                    src={pet.image}
                                                    alt={pet.name}
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.5s ease',
                                                        transform: hoveredId === pet.id ? 'scale(1.05)' : 'scale(1)'
                                                    }}
                                                />

                                                {/* Gradient Overlay */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '60%',
                                                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                                                    pointerEvents: 'none'
                                                }} />
                                            </Link>

                                            {/* Top Left: Distance Badge */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                left: '12px',
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(4px)',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                zIndex: 10
                                            }}>
                                                <MapPin weight="fill" size={14} color="var(--primary-600)" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                                                    {pet.owner_profile?.show_location === false ? 'Hidden' : (getDistance(userLoc?.lat, userLoc?.lng, pet.owner_profile?.latitude, pet.owner_profile?.longitude) || 'Unknown')}
                                                </span>
                                            </div>

                                            {/* Top Right: Like Button */}
                                            <Button
                                                onClick={(e) => handleLike(e, pet)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    background: 'rgba(255, 255, 255, 0.95)',
                                                    backdropFilter: 'blur(4px)',
                                                    borderRadius: '50%',
                                                    width: '36px',
                                                    height: '36px',
                                                    padding: 0,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                    zIndex: 10,
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Heart
                                                    weight="fill"
                                                    color={likes.includes(pet.id) ? 'var(--gray-900)' : 'var(--gray-900)'}
                                                    size={18}
                                                />
                                            </Button>

                                            {/* Bottom Left: Info Overlay */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '24px',
                                                left: '24px',
                                                right: '24px',
                                                zIndex: 10,
                                                pointerEvents: 'none'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid white' }}>
                                                        <img
                                                            src={pet.owner_profile?.avatar_url || `https://ui-avatars.com/api/?name=${pet.owner_profile?.username || 'User'}&background=random`}
                                                            alt="Owner"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                        {pet.owner_profile?.username || 'Owner'}
                                                    </div>
                                                </div>

                                                <h3 style={{
                                                    fontSize: '1.75rem',
                                                    fontWeight: 800,
                                                    color: 'white',
                                                    marginBottom: '4px',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                    fontFamily: '"Outfit", sans-serif',
                                                    letterSpacing: '-0.02em',
                                                    lineHeight: 1.1
                                                }}>
                                                    {pet.name}
                                                </h3>
                                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                                    {pet.gender || 'Unknown Gender'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 500 }}>
                                                    <span>{pet.breed}</span>
                                                    <span style={{ opacity: 0.6 }}>•</span>
                                                    <span>{/^\d+$/.test(pet.age?.toString()) ? `${pet.age} yrs` : pet.age}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                ))}
                            </>
                        ) : (
                            !loading && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: 'var(--gray-400)' }}>
                                    <div style={{ background: 'var(--gray-100)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <PawPrint size={32} weight="duotone" />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>No pets found</h3>
                                    <p style={{ fontSize: '1rem' }}>Try adjusting your search or filters.</p>
                                    <Button variant="outline" onClick={clearFilters} style={{ marginTop: '1.5rem' }}>Clear Filters</Button>
                                </div>
                            )
                        )}

                        {/* Load More Trigger */}
                        {pets.length > 0 && hasMore && (
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                                <Button
                                    onClick={() => loadPets(false)}
                                    disabled={loading}
                                    style={{ minWidth: '150px' }}
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MatchFeed;
