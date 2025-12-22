import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { petService } from '../lib/petService';
import Button from '../components/Button';
import { Camera, Crop, X, CaretLeft } from '@phosphor-icons/react';
import ImageCropper from '../components/ImageCropper';

const AddPet = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [petForm, setPetForm] = useState({
        name: '',
        breed: '',
        age: '',
        gender: 'Male',
        traits: [] as string[],
        bio: '',
        image: '',
        type: 'dog' // Default
    });

    const [cropImage, setCropImage] = useState<string | null>(null);
    const [traitInput, setTraitInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setCropImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        setPetForm(prev => ({ ...prev, image: croppedBase64 }));
        setCropImage(null);
    };

    const handleAddTrait = () => {
        if (!traitInput.trim()) return;
        const newTrait = traitInput.trim();
        if (!petForm.traits.includes(newTrait)) {
            setPetForm(prev => ({
                ...prev,
                traits: [...prev.traits, newTrait]
            }));
        }
        setTraitInput('');
    };

    const handleRemoveTrait = (trait: string) => {
        setPetForm(prev => ({
            ...prev,
            traits: prev.traits.filter(t => t !== trait)
        }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (!petForm.name) return alert("Please enter a name");
        if (!petForm.breed) return alert("Please enter a breed");

        setIsSubmitting(true);
        try {
            await petService.createPet({
                ...petForm,
                owner_id: user.id
            });
            navigate('/profile');
        } catch (err) {
            console.error("Failed to create pet", err);
            alert("Failed to add pet. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)', padding: '2rem' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginRight: '1rem', padding: '0.5rem' }}>
                        <CaretLeft size={24} weight="bold" />
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>Add a New Pet</h1>
                        <p style={{ color: '#6b7280' }}>Fill in the details below to add your pet.</p>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>

                    {/* Image Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', border: '4px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <img src={petForm.image || `https://ui-avatars.com/api/?name=${petForm.name || 'Pet'}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            {petForm.image && (
                                <div
                                    onClick={() => setCropImage(petForm.image)}
                                    style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        background: 'white', color: '#374151',
                                        borderRadius: '50%', width: '36px', height: '36px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', border: '1px solid #e5e7eb',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                    title="Crop Photo"
                                >
                                    <Crop size={18} weight="bold" />
                                </div>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Camera size={20} /> Upload Photo
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Name</label>
                            <input
                                type="text"
                                value={petForm.name}
                                onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                                placeholder="Pet's Name"
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                            />
                        </div>

                        {/* Species Select */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Type</label>
                            <select
                                value={petForm.type}
                                onChange={e => setPetForm({ ...petForm, type: e.target.value })}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', background: 'white' }}
                            >
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Breed & Age */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Breed</label>
                                <input
                                    type="text"
                                    value={petForm.breed}
                                    onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                                    placeholder="e.g. Golden Retriever"
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    list="breeds"
                                />
                                <datalist id="breeds">
                                    <option value="Golden Retriever" />
                                    <option value="Labrador" />
                                    <option value="Bulldog" />
                                    <option value="Poodle" />
                                    <option value="German Shepherd" />
                                </datalist>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Age</label>
                                <input
                                    type="text"
                                    value={petForm.age}
                                    onChange={e => setPetForm({ ...petForm, age: e.target.value })}
                                    placeholder="e.g. 2 years"
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Gender</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {['Male', 'Female'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setPetForm({ ...petForm, gender: g })}
                                        style={{
                                            flex: 1,
                                            padding: '0.875rem',
                                            borderRadius: '12px',
                                            border: `1px solid ${petForm.gender === g ? 'var(--primary-600)' : '#d1d5db'}`,
                                            background: petForm.gender === g ? 'var(--primary-50)' : 'white',
                                            color: petForm.gender === g ? 'var(--primary-700)' : '#374151',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Traits */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Traits</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <input
                                    type="text"
                                    value={traitInput}
                                    onChange={e => setTraitInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTrait()}
                                    placeholder="Add a trait (e.g. Playful)"
                                    style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                />
                                <Button onClick={handleAddTrait} variant="outline">Add</Button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {petForm.traits.map((trait, i) => (
                                    <div key={i} style={{ background: '#f3f4f6', padding: '6px 12px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {trait}
                                        <button
                                            onClick={() => handleRemoveTrait(trait)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}
                                        >
                                            <X size={14} weight="bold" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Bio</label>
                            <textarea
                                value={petForm.bio}
                                onChange={e => setPetForm({ ...petForm, bio: e.target.value })}
                                placeholder="Tell us about your pet..."
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #d1d5db', minHeight: '100px', fontSize: '1rem', lineHeight: 1.5, resize: 'vertical' }}
                            />
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                        >
                            Save Pet
                        </Button>

                    </div>
                </div>
            </div>

            {cropImage && (
                <ImageCropper
                    imageSrc={cropImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={1}
                />
            )}
        </div>
    );
};

export default AddPet;
