import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { PET_TYPES, BREEDS } from '../data/breeds';
import PetCardSkeleton from '../components/PetCardSkeleton';

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};



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


    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { width: windowWidth } = useWindowSize();
    const isMobile = windowWidth <= 768;

    // Filter Controls
    const [showFilters, setShowFilters] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // Multi-select array
    const [selectedGender, setSelectedGender] = useState<string>('all');
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]); // Keep as array
    // Age Slider State: [min, max] indices
    // Default 22 items (0 to 20+), so max index is 21
    const [ageRange, setAgeRange] = useState<[number, number]>([0, 21]);
    const [selectedAges, setSelectedAges] = useState<string[]>([]); // Derived from range for API
    const [maxDistance, setMaxDistance] = useState<number>(50); // Default 50km
    const [locationQuery, setLocationQuery] = useState('');
    const [countryQuery, setCountryQuery] = useState(''); // New Country State
    const [stateQuery, setStateQuery] = useState(''); // New State filter
    const [breedSearchQuery, setBreedSearchQuery] = useState(''); // New state for breed search

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
                    type: selectedTypes, // Pass array directly
                    breeds: selectedBreeds,
                    ages: selectedAges,
                    search: searchQuery,
                    distance: maxDistance,
                    userLocation: userLoc,
                    location: locationQuery,
                    country: countryQuery,
                    state: stateQuery, // Pass state
                    gender: selectedGender
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
    }, [user, selectedTypes, selectedGender, selectedBreeds, selectedAges, searchQuery, maxDistance, userLoc, locationQuery, countryQuery, stateQuery]);



    // Derived Age Options based on Max Lifespan
    const ageOptions = useMemo(() => {
        let maxAge = 20; // Default (All)

        if (selectedTypes.length > 0 && !selectedTypes.includes('all')) {
            let maxLifespan = 0;
            selectedTypes.forEach(tId => {
                const typeInfo = PET_TYPES.find(t => t.id === tId);
                if (typeInfo?.maxLifespan && typeInfo.maxLifespan > maxLifespan) {
                    maxLifespan = typeInfo.maxLifespan;
                }
            });
            if (maxLifespan > 0) {
                maxAge = maxLifespan + 5; // Lifespan + 5 buffer
            }
        }

        return [
            '< 1 yr',
            ...Array.from({ length: maxAge }, (_, i) => `${i + 1} yr${i === 0 ? '' : 's'}`),
            `${maxAge}+ yrs`
        ];
    }, [selectedTypes]);

    // Reset or Clamp Age Range when options change
    useEffect(() => {
        setAgeRange(prev => {
            // If previous max was at the end, keep it at the end of new range
            // Otherwise ensure it fits within new length
            const newMaxIndex = ageOptions.length - 1;

            // If "All" ages was selected (full range), reset to new full range
            // This is a heuristic to keep "view all" behavior consistent when switching types
            // checking if the old range was effectively the "whole bar"
            // We can't strictly know the previous length here without extra state, 
            // but we can assume if max index was high, we probably want to keep it high.
            // Safe bet: just clamp.

            const newStart = Math.min(prev[0], newMaxIndex);
            // If the user had the slider all the way to the right, keep it all the way to the right.
            // Otherwise clamp.
            // Actually, simpler: just reset to full checks if type changes? 
            // The user might be annoyed if they filtered to "2 years" and switching type resets it.
            // So clamping is better.

            let newEnd = Math.min(prev[1], newMaxIndex);
            if (prev[1] >= 20 && newMaxIndex > 20) {
                // If they had it maxed out before, likely want it maxed out now
                newEnd = newMaxIndex;
            }

            return [newStart, newEnd];
        });
    }, [ageOptions]);

    // Update selectedAges when range changes
    useEffect(() => {
        // Map range indices to query values
        // We select from index ageRange[0] to ageRange[1]
        const queryValues: string[] = [];
        const maxIndex = ageOptions.length - 1;

        for (let i = ageRange[0]; i <= ageRange[1]; i++) {
            if (i === 0) {
                // < 1 yr
                queryValues.push('0', '< 1 yr', '0 yr', '0 yrs', '0 year', '0 years');
            } else if (i === maxIndex) {
                // Max+ yrs
                // Add variants and some logical upper bound numbers
                // Extract number from string like "25+ yrs" -> 25
                const maxNum = parseInt(ageOptions[maxIndex]) || 20;

                queryValues.push(maxNum.toString(), `${maxNum}+`, `${maxNum} yrs`, `${maxNum} years`);
                // Add buffer numbers above max
                for (let j = maxNum + 1; j <= maxNum + 10; j++) queryValues.push(j.toString());
            } else {
                // Standard years (index matches year number)
                // index matches the year number directly because index 1 is '1 yr'
                const year = i.toString();
                queryValues.push(year, `${year} yr`, `${year} yrs`, `${year} year`, `${year} years`);
            }
        }

        // If range covers full spectrum, empty means "all"
        if (ageRange[0] === 0 && ageRange[1] === maxIndex) {
            setSelectedAges([]);
        } else {
            setSelectedAges([...new Set(queryValues)]);
        }
    }, [ageRange, ageOptions]);

    // Derived Filter Options (Breeds) based on Type AND Search
    const availableBreeds = useMemo(() => {
        let breeds: string[] = [];

        if (selectedTypes.length === 0) {
            return [];
        } else {
            selectedTypes.forEach(t => {
                if (BREEDS[t]) {
                    breeds = [...breeds, ...BREEDS[t]];
                }
            });
        }

        // Filter by breed search query
        if (breedSearchQuery) {
            breeds = breeds.filter(b => b.toLowerCase().includes(breedSearchQuery.toLowerCase()));
        }

        return [...new Set(breeds)].sort();
    }, [selectedTypes, breedSearchQuery]);

    // Handlers
    const toggleType = (typeId: string) => {
        if (typeId === 'all') {
            setSelectedTypes([]);
            setSelectedBreeds([]);
            return;
        }

        setSelectedTypes(prev => {
            if (prev.includes(typeId)) {
                return prev.filter(t => t !== typeId);
            } else {
                return [...prev, typeId];
            }
        });
        setSelectedBreeds([]);
    };

    const toggleBreed = (breed: string) => {
        setSelectedBreeds(prev => prev.includes(breed) ? prev.filter(b => b !== breed) : [...prev, breed]);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedTypes([]);
        setSelectedGender('all');
        setSelectedBreeds([]);
        setBreedSearchQuery('');
        setAgeRange([0, 21]);
        setLocationQuery('');
        setCountryQuery('');
        setStateQuery(''); // Added
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

    // Infinite Scroll Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const observerRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadPets(false);
            }
        }, { threshold: 0.1, rootMargin: '100px' });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

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
                    position: isMobile ? 'fixed' : 'fixed', // Fixed for both, but different coordinates
                    top: isMobile ? '72px' : '145px', // Below nav and search bar
                    left: 0,
                    right: isMobile ? 0 : 'auto',
                    bottom: 0,
                    zIndex: 40,
                    background: 'var(--color-bg-card)',
                    width: isMobile ? '100%' : (showFilters ? '300px' : '0px'),
                    opacity: showFilters ? 1 : 0,
                    pointerEvents: showFilters ? 'auto' : 'none',
                    borderRight: '1px solid var(--color-border)',
                    height: isMobile ? 'calc(100vh - 72px)' : 'calc(100vh - 145px)',
                    overflowY: 'auto',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isMobile ? 'none' : '2px 0 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ width: isMobile ? '100%' : '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Filters</h2>
                            {(selectedTypes.length > 0 || selectedBreeds.length > 0 || selectedAges.length > 0) && (
                                <button onClick={clearFilters} style={{ fontSize: '0.875rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>CLEAR</button>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
                            {/* Categories */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Pet Type</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {[
                                        { id: 'all', label: 'All Types' },
                                        ...PET_TYPES
                                    ].map((type) => {
                                        const isChecked = type.id === 'all'
                                            ? selectedTypes.length === 0
                                            : selectedTypes.includes(type.id);

                                        return (
                                            <label key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: isChecked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleType(type.id)}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-600)', borderRadius: '4px' }}
                                                />
                                                {type.label}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Gender */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Gender</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'Male', label: 'Male' },
                                        { id: 'Female', label: 'Female' }
                                    ].map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setSelectedGender(g.id)}
                                            style={{
                                                flex: 1,
                                                padding: '6px 0',
                                                borderRadius: 'var(--radius-md)',
                                                border: `1px solid ${selectedGender === g.id ? 'var(--primary-600)' : 'var(--color-border)'}`,
                                                background: selectedGender === g.id ? 'var(--primary-50)' : 'white',
                                                color: selectedGender === g.id ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Age Range Slider */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>
                                    Age Range: <span style={{ color: 'var(--primary-600)' }}>{ageOptions[ageRange[0]]} - {ageOptions[ageRange[1]]}</span>
                                </h3>
                                <div style={{ padding: '0 0.5rem' }}>
                                    {/* Simple Dual Slider Implementation combining two range inputs */}
                                    <div style={{ position: 'relative', height: '20px' }}>
                                        {/* Track */}
                                        <div style={{ position: 'absolute', top: '9px', left: 0, right: 0, height: '2px', background: 'var(--color-border)', borderRadius: '1px' }}></div>
                                        {/* Highlight Track */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '9px',
                                            left: `${(ageRange[0] / (ageOptions.length - 1)) * 100}%`,
                                            right: `${100 - (ageRange[1] / (ageOptions.length - 1)) * 100}%`,
                                            height: '2px',
                                            background: 'var(--primary-600)',
                                            borderRadius: '1px'
                                        }}></div>

                                        {/* Min Thumb */}
                                        <input
                                            type="range"
                                            className="age-slider-thumb"
                                            min={0}
                                            max={ageOptions.length - 1}
                                            value={ageRange[0]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setAgeRange([Math.min(val, ageRange[1]), ageRange[1]]);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '20px',
                                                appearance: 'none',
                                                background: 'transparent',
                                                pointerEvents: 'none',
                                                zIndex: 3
                                            }}
                                        />

                                        {/* Max Thumb */}
                                        <input
                                            type="range"
                                            className="age-slider-thumb"
                                            min={0}
                                            max={ageOptions.length - 1}
                                            value={ageRange[1]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setAgeRange([ageRange[0], Math.max(val, ageRange[0])]);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '20px',
                                                appearance: 'none',
                                                background: 'transparent',
                                                pointerEvents: 'none',
                                                zIndex: 4,
                                            }}
                                        />

                                        {/* CSS to make thumbs clickable */}
                                        <style>{`
                                            .age-slider-thumb::-webkit-slider-thumb {
                                                pointer-events: auto; /* Enable pointer events on thumb */
                                                appearance: none;
                                                -webkit-appearance: none;
                                                width: 16px;
                                                height: 16px;
                                                border-radius: 50%;
                                                background: var(--primary-600);
                                                border: 2px solid white;
                                                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                                                cursor: pointer;
                                                /* Center vertically in the 20px height input */
                                                /* No margin needed if height matches container or is centered by default */
                                                /* If alignment is still off, use margin-top to tweak */
                                            }
                                            .age-slider-thumb::-moz-range-thumb {
                                                pointer-events: auto;
                                                appearance: none;
                                                width: 16px;
                                                height: 16px;
                                                border-radius: 50%;
                                                background: var(--primary-600);
                                                border: 2px solid white;
                                                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                                                cursor: pointer;
                                                border: none; /* Reset Mozilla default border if any */
                                            }
                                        `}</style>
                                    </div>
                                </div>
                            </div>

                            {/* Breed */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Breed</h3>
                                {selectedTypes.length === 0 ? (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Select a category to filter breeds</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {/* Breed Search Input */}
                                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                                            <MagnifyingGlass
                                                size={14}
                                                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search breeds..."
                                                value={breedSearchQuery}
                                                onChange={(e) => setBreedSearchQuery(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 0.5rem 0.5rem 2rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)',
                                                    fontSize: '0.875rem',
                                                    background: 'var(--color-bg-subtle)',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        {/* Scrollable Breed List */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                            maxHeight: '200px', // Limit height
                                            overflowY: 'auto', // Enable scrolling
                                            paddingRight: '4px' // Space for scrollbar
                                        }}>
                                            {availableBreeds.length > 0 ? (
                                                availableBreeds.map(breed => (
                                                    <label key={breed} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedBreeds.includes(breed)}
                                                            onChange={() => toggleBreed(breed)}
                                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary-600)', borderRadius: '4px', flexShrink: 0 }}
                                                        />
                                                        {breed}
                                                    </label>
                                                ))
                                            ) : (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No breeds found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Location Search */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>Location</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                        <input
                                            type="text"
                                            placeholder="City..."
                                            value={locationQuery}
                                            onChange={(e) => setLocationQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '0.95rem',
                                                background: 'var(--color-bg-app)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                        />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                        <input
                                            type="text"
                                            placeholder="Country..."
                                            value={countryQuery}
                                            onChange={(e) => setCountryQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '0.95rem',
                                                background: 'var(--color-bg-app)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                        />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                        <input
                                            type="text"
                                            placeholder="State..."
                                            value={stateQuery}
                                            onChange={(e) => setStateQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '0.95rem',
                                                background: 'var(--color-bg-app)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Distance */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>
                                    Distance: {maxDistance} km
                                </h3>
                                <div style={{ padding: '0 0.5rem' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="500"
                                        value={maxDistance}
                                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        <span>1km</span>
                                        <span>500km</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Apply Button */}
                        {isMobile && (
                            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                                <Button fullWidth onClick={() => setShowFilters(false)} variant="primary">View {pets.length} Results</Button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Grid */}
                <main style={{
                    flex: 1,
                    padding: '1.5rem',
                    marginLeft: !isMobile && showFilters ? '300px' : '0',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
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
                        {loading && pets.length === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <PetCardSkeleton key={i} />
                            ))
                        ) : pets.length > 0 ? (
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
                                                    boxShadow: likes.includes(pet.id)
                                                        ? '0 0 15px rgba(239, 68, 68, 0.6), 0 2px 8px rgba(0,0,0,0.15)'
                                                        : '0 2px 8px rgba(0,0,0,0.15)',
                                                    zIndex: 10,
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <Heart
                                                    weight="fill"
                                                    color={likes.includes(pet.id) ? '#ef4444' : 'var(--gray-900)'}
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
                                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
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

                        {/* Infinite Scroll Sentinel */}
                        {pets.length > 0 && hasMore && (
                            <div
                                ref={observerRef}
                                style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '2rem 0',
                                    minHeight: '80px'
                                }}
                            >
                                {loading && (
                                    <div className="skeleton-pulse" style={{ width: '150px', height: '40px', borderRadius: '20px' }}></div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div >
        </div >
    );
};

export default MatchFeed;
