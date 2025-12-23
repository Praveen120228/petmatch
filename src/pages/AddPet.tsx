import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { petService } from '../lib/petService';
import Button from '../components/Button';
import { Camera, X, CaretLeft, PencilSimple } from '@phosphor-icons/react';
import ImageCropper from '../components/ImageCropper';
import SearchableSelect from '../components/SearchableSelect';
import { storageService } from '../lib/storageService';
import { PET_TYPES } from '../data/breeds';
import { BREEDS_BY_TYPE } from '../lib/petBreeds'; // Keep for breeds list

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
        images: [] as string[],
        type: 'dog' // Default
    });

    const [cropImage, setCropImage] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [traitInput, setTraitInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const remainingSlots = 5 - petForm.images.length;

            if (remainingSlots <= 0) {
                alert("You can only add up to 5 photos.");
                e.target.value = '';
                return;
            }

            // If user selects more than fits, just take what fits or all if fits
            const filesToProcess = files.slice(0, remainingSlots);

            if (filesToProcess.length === 1) {
                // Single file: Enable cropping flow for better UX on single uploads
                const reader = new FileReader();
                reader.onload = () => {
                    setCropImage(reader.result as string);
                };
                reader.readAsDataURL(filesToProcess[0]);
            } else {
                // Bulk upload: Skip cropper, add all directly
                const promises = filesToProcess.map(file => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                });

                const newBase64Images = await Promise.all(promises);

                setPetForm(prev => {
                    const updatedImages = [...prev.images, ...newBase64Images];
                    return {
                        ...prev,
                        images: updatedImages,
                        image: updatedImages[0]
                    };
                });
            }
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        setPetForm(prev => {
            let newImages;
            if (editingIndex !== null) {
                // Update existing image
                newImages = [...prev.images];
                newImages[editingIndex] = croppedBase64;
            } else {
                // Add new image
                newImages = [...prev.images, croppedBase64];
            }

            return {
                ...prev,
                images: newImages,
                image: newImages[0] // Primary is always first
            };
        });
        setCropImage(null);
        setEditingIndex(null);
    };

    const handleEditImage = (index: number) => {
        const imageToEdit = petForm.images[index];
        if (imageToEdit) {
            setEditingIndex(index);
            setCropImage(imageToEdit);
        }
    };

    const handleRemoveImage = (index: number) => {
        setPetForm(prev => {
            const newImages = prev.images.filter((_, i) => i !== index);
            return {
                ...prev,
                images: newImages,
                image: newImages.length > 0 ? newImages[0] : ''
            };
        });
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
            // 1. Upload Images to Storage
            const uploadedImageUrls: string[] = [];

            // Process each image sequentially (or parallel)
            for (const imgStr of petForm.images) {
                if (imgStr.startsWith('data:')) {
                    // It's a raw base64, needs upload
                    const blob = storageService.base64ToBlob(imgStr);
                    const url = await storageService.uploadPetImage(blob, user.id);
                    uploadedImageUrls.push(url);
                } else if (imgStr.startsWith('http')) {
                    // Already a URL (e.g. edit mode existing image)
                    uploadedImageUrls.push(imgStr);
                }
            }

            // Ensure we have at least one image if required, or handle empty
            const primaryImage = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : '';

            // 2. Submit Pet Data with URLs
            await petService.createPet({
                ...petForm,
                owner_id: user.id,
                images: uploadedImageUrls,
                image: primaryImage
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
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginRight: '0.5rem', padding: '0.5rem', borderRadius: '50%' }}>
                        <CaretLeft size={24} weight="bold" />
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>New Companion</h1>
                        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Add your pet's details below.</p>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>

                    {/* Image Upload - Centered & Compact */}
                    {/* Image Gallery */}
                    {/* Image Gallery */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {/* Existing Images */}
                            {petForm.images.map((img, index) => (
                                <div key={index} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <img src={img} alt={`Pet ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => handleEditImage(index)}
                                        style={{
                                            position: 'absolute', top: '4px', left: '4px',
                                            background: 'rgba(255,255,255,0.9)', color: 'var(--primary-600)',
                                            borderRadius: '50%', width: '24px', height: '24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: 'none', cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <PencilSimple size={14} weight="bold" />
                                    </button>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            borderRadius: '50%', width: '24px', height: '24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        <X size={14} weight="bold" />
                                    </button>

                                    {index === 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            fontSize: '0.65rem', padding: '2px 0', textAlign: 'center', fontWeight: 600,
                                            backdropFilter: 'blur(2px)'
                                        }}>
                                            COVER
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Button */}
                            {petForm.images.length < 5 && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '100px', height: '100px',
                                        borderRadius: '16px',
                                        border: '2px dashed #e5e7eb',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        background: '#f9fafb',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.color = 'var(--primary-600)'; e.currentTarget.style.background = 'var(--primary-50)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = '#f9fafb'; }}
                                >
                                    <Camera size={24} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Add Photo</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple style={{ display: 'none' }} />
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem', textAlign: 'center' }}>
                            Add up to 5 photos. The first one will be the cover.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Name Input */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
                            <input
                                type="text"
                                value={petForm.name}
                                onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                                placeholder="Pet's Name"
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb', transition: 'all 0.2s' }}
                                onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--primary-300)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-50)'; }}
                                onBlur={e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Toggles Row: Type & Gender */}
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', zIndex: 20 }}>
                            {/* Type Toggle */}
                            {/* Type Selection */}
                            <div style={{ flex: 1, minWidth: '140px' }}>
                                <SearchableSelect
                                    label="TYPE"
                                    options={PET_TYPES.map(t => t.label)}
                                    value={petForm.type.charAt(0).toUpperCase() + petForm.type.slice(1)}
                                    onChange={(val) => {
                                        const typeId = PET_TYPES.find(t => t.label === val)?.id || val.toLowerCase();
                                        setPetForm({ ...petForm, type: typeId });
                                    }}
                                    placeholder="Select Type"
                                />
                            </div>

                            {/* Gender Toggle */}
                            <div style={{ flex: 1, minWidth: '140px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</label>
                                <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px' }}>
                                    {['Male', 'Female'].map(gender => (
                                        <button
                                            key={gender}
                                            onClick={() => setPetForm({ ...petForm, gender })}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: petForm.gender === gender ? 'white' : 'transparent',
                                                color: petForm.gender === gender ? 'var(--primary-700)' : '#6b7280',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                boxShadow: petForm.gender === gender ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Breed & Age Row */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breed</label>
                                {BREEDS_BY_TYPE[petForm.type] ? (
                                    <SearchableSelect
                                        options={BREEDS_BY_TYPE[petForm.type]}
                                        value={petForm.breed}
                                        onChange={(val) => setPetForm({ ...petForm, breed: val })}
                                        placeholder={`Select ${petForm.type} breed`}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={petForm.breed}
                                        onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                                        placeholder="Brief Breed"
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb' }}
                                    />
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age (Years)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={petForm.age}
                                    onChange={e => {
                                        let val = e.target.value.replace(/[^0-9]/g, '');

                                        // Validate Max Age based on Type
                                        const typeInfo = PET_TYPES.find(t => t.id === petForm.type);
                                        const maxAge = (typeInfo?.maxLifespan || 20) + 5;

                                        if (val && parseInt(val) > maxAge) {
                                            // Optional: User feedback or just clamp
                                            // For now, let's clamp it silently or toast? 
                                            // User asked to "limit", forcing it is clearest
                                            val = maxAge.toString();
                                            alert(`Age limited to ${maxAge} years for ${typeInfo?.label || 'this pet type'}.`);
                                        }

                                        setPetForm({ ...petForm, age: val });
                                    }}
                                    placeholder="2"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb' }}
                                />
                            </div>
                        </div>

                        {/* Traits Input (Clean) */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Traits</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={traitInput}
                                    onChange={e => setTraitInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTrait()}
                                    placeholder="Add trait + Enter"
                                    style={{ width: '100%', padding: '0.75rem 1rem', paddingRight: '3rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem', background: '#f9fafb' }}
                                />
                                <button
                                    onClick={handleAddTrait}
                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary-600)' }}
                                >
                                    +
                                </button>
                            </div>
                            {petForm.traits.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    {petForm.traits.map((trait, i) => (
                                        <div key={i} style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--primary-100)' }}>
                                            {trait}
                                            <button
                                                onClick={() => handleRemoveTrait(trait)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary-400)' }}
                                            >
                                                <X size={12} weight="bold" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</label>
                            <textarea
                                value={petForm.bio}
                                onChange={e => setPetForm({ ...petForm, bio: e.target.value })}
                                placeholder="What makes your pet special?"
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', minHeight: '80px', fontSize: '1rem', background: '#f9fafb', resize: 'none' }}
                            />
                        </div>

                        <div style={{ marginTop: '0.5rem' }}>
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                style={{ borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', boxShadow: 'var(--shadow-colored)' }}
                            >
                                Create Profile
                            </Button>
                        </div>

                    </div>
                </div>
            </div>

            {cropImage && (
                <ImageCropper
                    imageSrc={cropImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setCropImage(null);
                        setEditingIndex(null);
                    }}
                    aspectRatio={1}
                />
            )}
        </div>
    );
};

export default AddPet;
