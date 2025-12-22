import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import SearchableSelect from '../components/SearchableSelect';
import { User, PawPrint, Camera, MapPin } from '@phosphor-icons/react';
import ImageCropper from '../components/ImageCropper';
import { useAuth } from '../context/AuthContext';
import { petService } from '../lib/petService';
import { PET_TYPES, BREEDS } from '../data/breeds';
import { supabase } from '../lib/supabase';

const Onboarding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Initialize step based on URL param or default to 1
    const initialStep = searchParams.get('step') === '2' ? 2 : 1;
    const [step, setStep] = useState(initialStep);
    const [isAnimating, setIsAnimating] = useState(false);

    // User details
    const [location, setLocation] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [bio, setBio] = useState('');

    // Check for existing profile OR existing pets (legacy users) to skip Step 1
    useEffect(() => {
        // If we already initialized to step 2 via URL, we can skip this check logic
        if (step === 2) return;

        // Skip profile check for now as we are migrating
    }, [user, step]);

    // Pet details
    const [petName, setPetName] = useState('');
    const [petType, setPetType] = useState('dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [color, setColor] = useState(''); // Added Color State
    const [images, setImages] = useState<string[]>([]);
    const [croppingImage, setCroppingImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setCroppingImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            // Reset input
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        setImages(prev => [...prev, croppedBase64]);
        setCroppingImage(null);
    };

    const handleNext = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setStep(step + 1);
            setIsAnimating(false);
        }, 300);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation is not supported by your browser");

        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setCoords({ lat: latitude, lng: longitude });
            try {
                // Approximate reverse geocoding via OpenStreetMap (Nominatim)
                // Note: In production, consider a paid service or cache this to avoid rate limits
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();

                let city = '';
                let state = '';

                if (data.address) {
                    city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                    state = data.address.state || data.address.country || '';
                }

                if (city) {
                    setLocation(state ? `${city}, ${state}` : city);
                } else {
                    setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
                }
            } catch (err) {
                console.error("Geocoding failed", err);
                // Fallback to coords if API fails
                setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            } finally {
                setIsLoadingLocation(false);
            }
        }, (err) => {
            console.error(err);
            alert("Could not retrieve location. Please allow location access.");
            setIsLoadingLocation(false);
        });
    };

    const handleFinish = async () => {
        if (!user) return alert("Please login first");

        try {
            // 1. Create Pet
            const newPetPayload = {
                name: petName,
                breed,
                age: age + ' yrs',
                gender,
                color, // Pass color
                type: petType,
                image: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
                images: images,
                owner_id: user.id,
                bio: bio || 'No bio yet.',
                traits: ['Friendly', 'New']
            };

            await petService.createPet(newPetPayload);

            // 2. Save Profile Extra Details (Location & Bio)
            if (location || bio) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        location: location,
                        bio: bio,
                        latitude: coords?.lat || null,
                        longitude: coords?.lng || null
                    })
                    .eq('id', user.id);

                if (error) console.error("Failed to update profile location:", error);
            }

            navigate('/profile');
        } catch (error) {
            console.error("Error creating pet:", error);
            alert("Failed to create pet. Please try again.");
        }
    };

    const renderStep1 = () => (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <User size={48} color="var(--color-secondary)" weight="duotone" />
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>About You</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Tell us a bit about yourself.</p>
            </div>
            <div style={{ position: 'relative' }}>
                <Input
                    label="Location (City, State)"
                    placeholder="New York, NY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    fullWidth
                    disabled={isLoadingLocation}
                />
                <button
                    onClick={handleGetLocation}
                    disabled={isLoadingLocation}
                    type="button"
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '40px', // Adjusted to align with input field, below label
                        background: 'transparent',
                        border: 'none',
                        color: isLoadingLocation ? 'var(--gray-400)' : 'var(--primary-600)',
                        cursor: isLoadingLocation ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}
                    title="Find my location"
                >
                    {isLoadingLocation ? (
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⌛</span>
                    ) : (
                        <MapPin size={20} weight="fill" />
                    )}
                    <span className="hide-on-mobile">Locate Me</span>
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: '0.25rem' }}>Bio</label>
                <textarea
                    placeholder="I love long walks in the park..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(15, 23, 42, 0.5)',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'inherit',
                        resize: 'none',
                        minHeight: '100px',
                        width: '100%'
                    }}
                />
            </div>
            <Button onClick={handleNext} fullWidth size="lg">Next: Your Pet</Button>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <PawPrint size={48} color="var(--color-accent)" weight="duotone" />
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Your Pet</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Who are we finding a match for?</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>Photos</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {images.map((img, index) => (
                        <div key={index} style={{
                            width: '100px', height: '100px', borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden', position: 'relative',
                            border: '2px solid var(--color-border)'
                        }}>
                            <img src={img} alt={`Pet ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div
                                onClick={() => setImages(images.filter((_, i) => i !== index))}
                                style={{
                                    position: 'absolute', top: '4px', right: '4px',
                                    background: 'rgba(0,0,0,0.6)', color: 'white',
                                    borderRadius: '50%', width: '20px', height: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', fontSize: '12px'
                                }}
                            >✕</div>
                        </div>
                    ))}
                    {images.length < 5 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100px', height: '100px', borderRadius: 'var(--radius-lg)',
                                background: 'rgba(255,255,255,0.05)', display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                                border: '2px dashed var(--color-text-secondary)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <Camera size={24} color="var(--color-text-secondary)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Add Photo</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}
                </div>
                <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {images.length === 0 ? 'Add at least one photo' : `${images.length}/5 photos added`}
                </p>
            </div>

            {/* Pet Type Selector - Full Grid */}
            <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'block', textAlign: 'center' }}>First, what kind of pet is it?</label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '1rem'
                }}>
                    {PET_TYPES.map(type => (
                        <div
                            key={type.id}
                            onClick={() => { setPetType(type.id); setBreed(''); }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                padding: '1rem', borderRadius: 'var(--radius-xl)',
                                border: petType === type.id ? '2px solid var(--primary-600)' : '1px solid var(--color-border)',
                                background: petType === type.id ? 'var(--primary-50)' : 'var(--color-bg-subtle)',
                                cursor: 'pointer', transition: 'all 0.2s',
                                textAlign: 'center'
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>
                                {type.id === 'dog' && '🐕'}
                                {type.id === 'cat' && '🐈'}
                                {type.id === 'rabbit' && '🐇'}
                                {type.id === 'bird' && '🦜'}
                                {type.id === 'hamster' && '🐹'}
                                {type.id === 'reptile' && '🐍'}
                                {type.id === 'fish' && '🐠'}
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: petType === type.id ? 'var(--primary-700)' : 'var(--color-text-secondary)' }}>{type.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Layout for Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
                <Input
                    label="Pet Name"
                    placeholder="e.g. Buddy"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    fullWidth
                    style={{ height: '100%' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <SearchableSelect
                        label="Breed"
                        placeholder={`Select ${petType} breed...`}
                        options={BREEDS[petType] || []}
                        value={breed}
                        onChange={setBreed}
                    />
                </div>

                <Input
                    label="Age"
                    placeholder="e.g. 3"
                    type="number"
                    min="0"
                    value={age}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 0 || e.target.value === '') {
                            setAge(e.target.value);
                        }
                    }}
                    fullWidth
                />

                <Input
                    label="Color"
                    placeholder="e.g. Brown & White"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    fullWidth
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: '0.25rem' }}>Gender</label>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--color-border)' }}>
                        {['Male', 'Female'].map(g => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGender(g)}
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    padding: '0.75rem',
                                    borderRadius: 'calc(var(--radius-md) - 4px)',
                                    background: gender === g ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                                    color: gender === g ? 'white' : 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    border: gender === g ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                    userSelect: 'none',
                                    outline: 'none'
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={handleFinish} fullWidth size="lg" variant="primary">Start Matching</Button>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            padding: '1rem',
            position: 'relative'
        }}>
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          /* Custom Scrollbar for dropdowns if needed */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
        `}
            </style>
            <Card style={{
                width: '100%',
                maxWidth: '900px',
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.3s ease',
                padding: '2rem 1rem' // Reduced padding for mobile by default, increased by style prop or media query if possible. Here using safer moderate padding.
            }}>
                {step === 1 ? renderStep1() : renderStep2()}
            </Card>

            {/* Step Indicator */}
            <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 1 ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 2 ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }} />
            </div>
            {croppingImage && (
                <ImageCropper
                    imageSrc={croppingImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCroppingImage(null)}
                    aspectRatio={4 / 3}
                />
            )}
        </div>
    );
};

export default Onboarding;
