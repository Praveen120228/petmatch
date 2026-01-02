import SEO from '../components/SEO';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MagnifyingGlass, PawPrint, Faders, MapPin } from '@phosphor-icons/react';
import PetCard from '../components/PetCard';
import Button from '../components/Button';
import { featureService } from '../lib/featureService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { petService } from '../lib/petService';
import { userService } from '../lib/userService';
import { PET_TYPES, BREEDS } from '../data/breeds';
import PetCardSkeleton from '../components/PetCardSkeleton';
import JourneyWidget from '../components/JourneyWidget';

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
    const [isInitializing, setIsInitializing] = useState(true);
    const [likes, setLikes] = useState<number[]>([]);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { width: windowWidth } = useWindowSize();
    const isMobile = windowWidth <= 768;
    const observerRef = useRef<HTMLDivElement | null>(null);

    // Filter Controls
    const [showFilters, setShowFilters] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedGender, setSelectedGender] = useState<string>('all');
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
    const [ageRange, setAgeRange] = useState<[number, number]>([0, 21]);
    const [selectedAges, setSelectedAges] = useState<string[]>([]);
    const [maxDistance, setMaxDistance] = useState<number>(50);
    const [locationQuery, setLocationQuery] = useState('');
    const [countryQuery, setCountryQuery] = useState('');
    const [stateQuery, setStateQuery] = useState('');
    const [breedSearchQuery, setBreedSearchQuery] = useState('');

    // Load Likes & Location (Once)
    useEffect(() => {
        if (!user) return;

        const init = async () => {
            try {
                const [likesData, profileData] = await Promise.all([
                    featureService.getLikes(user.id),
                    userService.getProfile(user.id)
                ]);

                setLikes(likesData);

                if (profileData?.latitude && profileData?.longitude) {
                    setUserLoc({ lat: profileData.latitude, lng: profileData.longitude });
                }
            } catch (error) {
                console.error("Error initializing feed:", error);
            } finally {
                setIsInitializing(false);
            }
        };

        init();
    }, [user]);

    // React Query for Infinite Scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['pets', {
            types: selectedTypes,
            breeds: selectedBreeds,
            ages: selectedAges,
            search: searchQuery,
            distance: maxDistance,
            userLoc, // Careful with object stability if not memoized, but state update ensures referential stability usually
            location: locationQuery,
            country: countryQuery,
            state: stateQuery,
            gender: selectedGender
        }],
        queryFn: async ({ pageParam = 1 }) => {
            if (!user) return [];
            const { data } = await petService.getPetsPaginated(
                user.id,
                pageParam,
                20,
                {
                    type: selectedTypes,
                    breeds: selectedBreeds,
                    ages: selectedAges,
                    search: searchQuery,
                    distance: maxDistance,
                    userLocation: userLoc,
                    location: locationQuery,
                    country: countryQuery,
                    state: stateQuery,
                    gender: selectedGender
                }
            );
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 20 ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
        enabled: !!user && !isInitializing, // Wait for initialization
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });



    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) observer.unobserve(observerRef.current);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);



    const pets = useMemo(() => {
        const allPets = (data?.pages.flat() || []) as any[];
        let filteredPets = allPets;



        // Filter out pets that are already liked
        // if (likes && likes.length > 0) {
        //     const likedIds = new Set(likes);
        //     filteredPets = filteredPets.filter(p => !likedIds.has(p.id));
        // }

        return filteredPets;
    }, [data, likes]);

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



    const NAVBAR_HEIGHT = 72;
    const SEARCH_BAR_HEIGHT = 72; // Reduced height for tighter fit

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title="Find Pets"
                description="Browse adoptable pets and find your perfect match nearby."
            />

            {/* Top Search Bar (Global) */}
            <div style={{
                background: 'var(--color-bg-card)',
                borderBottom: '1px solid var(--color-border)',
                height: `${SEARCH_BAR_HEIGHT}px`, // Enforce height
                display: 'flex',
                alignItems: 'center', // Center content vertically
                padding: '0 1rem', // Remove vertical padding, let flex align
                position: 'sticky',
                top: NAVBAR_HEIGHT,
                zIndex: 30
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>

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

                    {/* Pet Count - Moved to Right of Search Bar */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{pets.length}</span>
                        <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>pets</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', width: '100%', flex: 1, position: 'relative' }}>

                {/* Filters - Sidebar on Desktop, Full Overlay on Mobile */}
                <aside style={{
                    position: isMobile ? 'fixed' : 'sticky', // Sticky for desktop to stay in flow but stick
                    top: isMobile ? `${NAVBAR_HEIGHT}px` : `${NAVBAR_HEIGHT + SEARCH_BAR_HEIGHT - 1}px`, // Precisely attached with 1px overlap
                    left: isMobile ? 0 : 'auto', // Auto for sticky (flex item)
                    right: isMobile ? 0 : 'auto',
                    bottom: isMobile ? 0 : 'auto',
                    zIndex: 40,
                    background: 'var(--color-bg-card)',
                    width: isMobile ? '100%' : (showFilters ? '300px' : '0px'),
                    opacity: showFilters ? 1 : 0,
                    pointerEvents: showFilters ? 'auto' : 'none',
                    borderRight: '1px solid var(--color-border)',
                    height: isMobile ? `calc(100vh - ${NAVBAR_HEIGHT}px)` : `calc(100vh - ${NAVBAR_HEIGHT + SEARCH_BAR_HEIGHT - 1}px)`,
                    overflowY: 'auto',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isMobile ? 'none' : '2px 0 10px rgba(0,0,0,0.05)',
                    alignSelf: 'flex-start' // Ensure it sticks at the top
                }}>
                    <div style={{ width: isMobile ? '100%' : '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Filters</h2>
                            {(selectedTypes.length > 0 || selectedBreeds.length > 0 || selectedAges.length > 0) && (
                                <button onClick={clearFilters} style={{ fontSize: '0.875rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>CLEAR</button>
                            )}
                        </div>

                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1 }}>
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
                    marginLeft: 0, // Flexbox handles the spacing now
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))', // Reduced width by ~19% (280 -> 225)
                        gap: '1.5rem', // Reduced gap slightly to balance density
                        paddingBottom: '4rem'
                    }}>
                        {(isLoading || isInitializing) && (
                            Array.from({ length: 8 }).map((_, i) => (
                                <PetCardSkeleton key={i} />
                            ))
                        )}
                        {!isLoading && !isInitializing && pets.length > 0 && (
                            <>
                                {pets.map(pet => (
                                    <PetCard
                                        key={pet.id}
                                        pet={pet}
                                        userLoc={userLoc}
                                        isLiked={likes.includes(pet.id)}
                                        onLike={(e) => handleLike(e, pet)}
                                        hoveredId={hoveredId}
                                        setHoveredId={setHoveredId}
                                    />
                                ))}
                                {isFetchingNextPage && (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <PetCardSkeleton key={`loading-${i}`} />
                                    ))
                                )}
                            </>
                        )}
                        {!isLoading && !isInitializing && pets.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 1rem', color: 'var(--gray-500)' }}>
                                <div style={{
                                    background: 'var(--gray-50)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    border: '1px solid var(--gray-100)'
                                }}>
                                    <PawPrint size={40} weight="duotone" color="var(--primary-400)" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '0.75rem' }}>No pets found</h3>
                                <p style={{ fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>We couldn't find any pets matching your criteria. Try adjusting your filters or location.</p>
                                <Button variant="outline" onClick={clearFilters} style={{ marginTop: '2rem' }}>Clear All Filters</Button>
                            </div>
                        )}

                        {/* Infinite Scroll Sentinel */}
                        {hasNextPage && (
                            <div
                                ref={observerRef}
                                style={{
                                    gridColumn: '1 / -1',
                                    height: '20px',
                                    marginTop: '1rem',
                                    visibility: 'hidden'
                                }}
                            />
                        )}
                    </div>
                </main >
            </div >
            <JourneyWidget />
        </div >
    );
};

export default MatchFeed;
