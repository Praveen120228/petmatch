import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import SearchableSelect from '../components/SearchableSelect';
import { User, PawPrint, Camera } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { petService } from '../lib/petService';
import { PET_TYPES, BREEDS } from '../data/breeds';
import { processImage } from '../utils/imageHandler';

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
    const [images, setImages] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages: string[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                try {
                    const base64 = await processImage(e.target.files[i]);
                    newImages.push(base64);
                } catch (err) {
                    console.error("Image processing failed", err);
                    alert("Failed to process image. Try a smaller file.");
                }
            }
            setImages(prev => [...prev, ...newImages].slice(0, 5)); // Cap at 5
        }
    };

    const handleNext = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setStep(step + 1);
            setIsAnimating(false);
        }, 300);
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
                type: petType,
                image: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
                images: images,
                owner_id: user.id,
                bio: bio || 'No bio yet.',
                traits: ['Friendly', 'New']
            };

            await petService.createPet(newPetPayload);

            // 2. Save Profile Extra Details (Optional / Future schema update)
            // await updateUser({ ... }); 

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
            <Input
                label="Location (City, State)"
                placeholder="New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
            />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
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
                maxWidth: '900px', // Spacious Desktop Width
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.3s ease',
                padding: '3rem'
            }}>
                {step === 1 ? renderStep1() : renderStep2()}
            </Card>

            {/* Step Indicator */}
            <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 1 ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 2 ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }} />
            </div>
        </div>
    );
};

export default Onboarding;
