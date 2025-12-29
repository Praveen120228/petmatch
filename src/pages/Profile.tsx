import SEO from '../components/SEO';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { MapPin, PencilSimple, SignOut, Plus, Heart, ChatCircle, Trash, CaretLeft, Camera, X, Crop, Folder, CaretRight, PawPrint, CaretDown } from '@phosphor-icons/react';
import ImageCropper from '../components/ImageCropper';

import { featureService } from '../lib/featureService';
import type { Collection } from '../lib/featureService';

import { petService } from '../lib/petService';
import { userService } from '../lib/userService';
import { storageService } from '../lib/storageService';
import { dateService } from '../lib/dateService';
import { chatService } from '../lib/chatService';

const COUNTRY_CODES = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'IN' },
    { code: '+61', country: 'AU' },
    { code: '+81', country: 'JP' },
    { code: '+49', country: 'DE' },
    { code: '+33', country: 'FR' },
    { code: '+86', country: 'CN' },
    { code: '+971', country: 'UAE' },
    { code: '+65', country: 'SG' },
    // Add more as needed
];

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // 'id' contains the username for public profile
    const [searchParams, setSearchParams] = useSearchParams();


    // Public vs Private Mode Logic
    const isPublic = !!id; // If ID exists, it's public

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.name || '',
        username: user?.username || '',
        location: '',
        country: '',
        state: '', // Added state
        bio: '',
        image: user?.image || '',
        latitude: null as number | null,
        longitude: null as number | null,
        show_location: true,
        phone_number: '',
        country_code: '+1' // Default
    });

    const [cropTarget, setCropTarget] = useState<'user' | 'pet'>('user');
    const [traitInput, setTraitInput] = useState(''); // State for new trait input
    const fileInputRef = useRef<HTMLInputElement>(null);
    const petFileInputRef = useRef<HTMLInputElement>(null);

    const handleAddTrait = () => {
        if (!traitInput.trim() || !editingPet) return;
        const newTrait = traitInput.trim();
        if (!editingPet.traits?.includes(newTrait)) {
            setEditingPet({
                ...editingPet,
                traits: [...(editingPet.traits || []), newTrait]
            });
        }
        setTraitInput('');
    };

    const handleRemoveTrait = (traitToRemove: string) => {
        if (!editingPet) return;
        setEditingPet({
            ...editingPet,
            traits: editingPet.traits?.filter((t: string) => t !== traitToRemove) || []
        });
    };

    const handleUserFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCropTarget('user');
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setEditForm(prev => ({ ...prev, image: reader.result as string }));
                // setCropImage(reader.result as string); // Skip auto-crop
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handlePetFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCropTarget('pet');
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setEditingPet((prev: any) => ({ ...prev, image: reader.result as string }));
                // setCropImage(reader.result as string); // Skip auto-crop
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        if (cropTarget === 'user') {
            setEditForm(prev => ({ ...prev, image: croppedBase64 }));
        } else if (cropTarget === 'pet' && editingPet) {
            setEditingPet((prev: any) => ({ ...prev, image: croppedBase64 }));
        }
        setCropImage(null);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation is not supported by your browser");

        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                // Approximate reverse geocoding via OpenStreetMap (Nominatim)
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();

                let city = '';
                let state = '';
                let countryName = '';

                if (data.address) {
                    city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                    state = data.address.state || '';
                    countryName = data.address.country || '';
                }

                const locString = city ? (state ? `${city}, ${state}` : city) : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                setEditForm(prev => ({ ...prev, location: locString, country: countryName, state: state, latitude, longitude }));

            } catch (err) {
                console.error("Geocoding failed", err);
                setEditForm(prev => ({ ...prev, location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, latitude, longitude }));
            } finally {
                setIsLoadingLocation(false);
            }
        }, (err) => {
            console.error(err);
            alert("Could not retrieve location. Please allow location access.");
            setIsLoadingLocation(false);
        });
    };



    // Filter Logic...

    // Tabs State (Derived from URL)
    const activeTab = searchParams.get('tab') || 'pets';

    // Collection State (Derived from URL)
    const expandedCollectionId = searchParams.get('collectionId');

    // Derived Data
    // Data State
    // Data State
    const [profileData, setProfileData] = useState<any>(null); // Real profile data from DB
    const [pets, setPets] = useState<any[]>([]);
    const [editingPet, setEditingPet] = useState<any>(null); // Pet currently being edited
    const [likedPets, setLikedPets] = useState<any[]>([]);
    const [matchedPets, setMatchedPets] = useState<any[]>([]);
    const [collectionPets, setCollectionPets] = useState<any[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);

    // Dating State
    const [dateRequests, setDateRequests] = useState<any[]>([]);
    const [myRelationships, setMyRelationships] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                if (!isPublic && user) {
                    // Private View: Load own data
                    const [userPets, userCols, userProfile] = await Promise.all([
                        petService.getUserPets(user.id),
                        featureService.getCollections(user.id),
                        userService.getProfile(user.id)
                    ]);

                    if (isMounted) {
                        setPets(userPets || []);
                        setCollections(userCols || []);

                        // Only update if we got a valid profile, otherwise keep existing/fallback safely
                        if (userProfile) {
                            setProfileData(userProfile);

                            // Initialize form with fresh data
                            // Parse phone number
                            const rawPhone = userProfile.phone_number || '';
                            let initialCode = '+1';
                            let initialNum = rawPhone;
                            for (const c of COUNTRY_CODES) {
                                if (rawPhone.startsWith(c.code)) {
                                    initialCode = c.code;
                                    initialNum = rawPhone.slice(c.code.length);
                                    break;
                                }
                            }

                            setEditForm({
                                name: userProfile.name || '',
                                username: userProfile.username || '',
                                location: userProfile.location || '',
                                country: userProfile.country || '',
                                state: userProfile.state || '',
                                bio: userProfile.bio || '',
                                image: userProfile.avatar_url || '',
                                latitude: userProfile.latitude || null,
                                longitude: userProfile.longitude || null,
                                show_location: userProfile.show_location !== false,
                                country_code: initialCode,
                                phone_number: initialNum
                            });
                        }
                    }

                    // Load likes/matches
                    const [likeIds, matchIds] = await Promise.all([
                        featureService.getLikes(user.id),
                        featureService.getMatches(user.id)
                    ]);

                    if (isMounted && userCols) {
                        const colItemIds = userCols.flatMap(c => c.items || []);
                        const uniqueIds = [...new Set([...likeIds, ...matchIds, ...colItemIds])];

                        if (uniqueIds.length > 0) {
                            const details = await petService.getPetsByIds(uniqueIds);
                            setLikedPets(details.filter(p => likeIds.includes(p.id)));
                            setMatchedPets(details.filter(p => matchIds.includes(p.id)));
                            setCollectionPets(details.filter(p => colItemIds.includes(p.id)));
                        } else {
                            setLikedPets([]);
                            setMatchedPets([]);
                            setCollectionPets([]);
                        }
                    }

                } else if (isPublic && id) {
                    // Public View: Load other user's data
                    const [targetProfile, targetPets] = await Promise.all([
                        userService.getProfile(id),
                        petService.getUserPets(id)
                    ]);

                    if (isMounted) {
                        setProfileData(targetProfile);
                        setPets(targetPets || []);
                        setLikedPets([]);
                        setMatchedPets([]);
                        setCollectionPets([]);
                    }
                }
            } catch (err) {
                console.error("Profile load error:", err);
                // Do not reset profileData to null here to prevent flashing fallback
            }
        }


        const loadDatingData = async () => {
            if (isPublic || !user) return;
            try {
                // Get my pets
                const myPets = await petService.getUserPets(user.id);
                if (myPets && myPets.length > 0) {
                    const myPetIds = myPets.map(p => p.id);
                    const requests = await dateService.getIncomingRequests(myPetIds);
                    if (isMounted) setDateRequests(requests);

                    // Get active relationships (Optimized: Fetch partners in bulk)
                    const petsWithPartners = myPets.filter(p => p.partner_pet_id);
                    const partnerIds = petsWithPartners.map(p => p.partner_pet_id).filter((id): id is number => !!id);

                    if (partnerIds.length > 0 && isMounted) {
                        const partners = await petService.getPetsByIds(partnerIds);
                        const relationships = petsWithPartners.map(pet => ({
                            myPet: pet,
                            partner: partners.find(p => p.id === pet.partner_pet_id)
                        })).filter(rel => !!rel.partner); // Ensure partner was found

                        setMyRelationships(relationships);
                    } else if (isMounted) {
                        setMyRelationships([]);
                    }
                }
            } catch (err) {
                console.error("Dating data error", err);
            }
        };

        loadData();
        loadDatingData();

        return () => { isMounted = false; };
    }, [user?.id, isPublic, id]); // Only depend on ID, not the whole user object to prevent spurious refetches

    // Derived for rendering
    const myMatches = matchedPets;
    const myLikes = likedPets;
    const userPets = pets;

    // Derived Data
    // Use fetched profile data if available, otherwise fall back to auth user (private) or simple placeholder (public)
    const profileUser = profileData ? {
        ...profileData,
        image: profileData.avatar_url || profileData.image // Handle DB field (avatar_url) vs App usage (image)
    } : (
        !isPublic && user ? {
            name: user.name,
            image: user.image,
            location: 'Update your location',
            bio: 'Tell us about yourself...'
        } : {
            name: 'Loading...',
            location: '...',
            bio: '...',
            image: undefined
        }
    );

    const handleAddPet = () => {
        navigate('/add-pet');
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        if (!user) return;
        if (!editForm.name.trim()) return alert("Name cannot be empty");
        if (!editForm.username.trim()) return alert("Username cannot be empty");
        if (!editForm.location.trim()) return alert("Location cannot be empty");
        if (!editForm.phone_number.trim()) return alert("Phone number is required");

        try {
            // Check uniqueness if username changed
            if (editForm.username !== user.username) {
                const isAvailable = await userService.checkUsernameAvailability(editForm.username, user.id);
                if (!isAvailable) {
                    return alert("Username is already taken. Please choose another one.");
                }
            }

            // 1. Upload Avatar if changed (Base64)
            let avatarUrl = editForm.image;
            if (editForm.image && editForm.image.startsWith('data:')) {
                const blob = storageService.base64ToBlob(editForm.image);
                avatarUrl = await storageService.uploadAvatar(blob, user.id);
            }

            // Update DB
            await userService.updateProfile(user.id, {
                name: editForm.name,
                username: editForm.username,
                avatar_url: avatarUrl, // Ensure mapping matches DB column 'avatar_url'
                location: editForm.location,
                country: editForm.country,
                state: editForm.state, // Added state
                bio: editForm.bio,
                latitude: editForm.latitude || undefined,
                longitude: editForm.longitude || undefined,
                show_location: editForm.show_location,
                phone_number: `${editForm.country_code}${editForm.phone_number}` // Combine
            });

            // Update Auth Context (for app-wide name/image)
            updateUser({ name: editForm.name, image: avatarUrl, username: editForm.username });

            // Force reload to refresh data
            setIsEditing(false);
            window.location.reload();
        } catch (err: any) {
            console.error("Failed to save profile", err);
            // Handle unique constraint error from DB if frontend check race condition occurred
            if (err.message && err.message.includes('unique constraint') && err.message.includes('username')) {
                alert("Username is already taken.");
            } else {
                alert("Failed to save profile changes.");
            }
        }
    };

    const handleSavePet = async () => {
        if (!editingPet || !user) return; // Need user for ID
        if (!editingPet.image) return alert("Please add a photo of your pet");
        try {
            // 1. Upload Image if changed
            let imageUrl = editingPet.image;
            if (editingPet.image && editingPet.image.startsWith('data:')) {
                const blob = storageService.base64ToBlob(editingPet.image);
                imageUrl = await storageService.uploadPetImage(blob, user.id);
            }

            await petService.updatePet(editingPet.id, {
                name: editingPet.name,
                breed: editingPet.breed,
                age: editingPet.age,
                gender: editingPet.gender,
                image: imageUrl,
                traits: editingPet.traits,
                bio: editingPet.bio
            });

            // Update local state with new URL
            const updatedPet = { ...editingPet, image: imageUrl };
            setPets(prev => prev.map(p => p.id === editingPet.id ? updatedPet : p));
            setEditingPet(null);
        } catch (err) {
            console.error("Failed to update pet", JSON.stringify(err, null, 2));
            alert(`Failed to update pet: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Dating Handlers
    const handleAcceptDate = async (reqId: number) => {
        try {
            await dateService.acceptRequest(reqId);
            // Refresh
            window.location.reload();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRejectDate = async (reqId: number) => {
        try {
            await dateService.rejectRequest(reqId);
            setDateRequests(prev => prev.filter(r => r.id !== reqId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleBreakUp = async (myPetId: number) => {
        if (!confirm("Are you sure you want to break up?")) return;
        try {
            await dateService.breakUp(myPetId);
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMessage = async () => {
        if (!user) return alert("Please login to message");
        // Ensure we have the target user's ID. 
        // profileData comes from DB, so it has the UUID 'id'.
        if (!profileData || !profileData.id) return alert("Cannot message this user");

        try {
            const chatId = await chatService.createConversation(user.id, profileData.id);
            navigate(`/messages/${chatId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to start chat");
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)' }}>
            <SEO
                title={profileUser.name || 'Profile'}
                description={isPublic ? `Check out ${profileUser.name}'s profile on Specyf` : 'Manage your pet profile and settings.'}
            />

            {/* Minimalist Header */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>

                    {/* Left: Back Button & User Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Back Button (Public Only) */}
                        {isPublic && (
                            <div
                                onClick={() => navigate(-1)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-primary)'
                                }}
                            >
                                <CaretLeft size={24} weight="bold" />
                            </div>
                        )}

                        {/* User Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div
                                onClick={!isPublic ? () => setIsEditing(true) : undefined}
                                style={{
                                    width: '80px', // Smaller on mobile check might be better but this is safe
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    cursor: !isPublic ? 'pointer' : 'default',
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => { if (!isPublic) e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={(e) => { if (!isPublic) e.currentTarget.style.opacity = '1'; }}
                            >
                                <img
                                    src={profileUser.image || `https://ui-avatars.com/api/?name=${profileUser.name || 'User'}&background=${isPublic ? 'random' : '0D8ABC'}&size=128`}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {
                                    !isPublic && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                        >
                                            <PencilSimple color="white" weight="bold" size={20} />
                                        </div>
                                    )
                                }
                            </div>

                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, color: '#111827' }}>{profileUser.name}</h1>
                                {profileUser.username && <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>@{profileUser.username}</p>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                    <MapPin weight="fill" color="#9ca3af" size={16} />
                                    <span>{isPublic && !(profileUser as any).show_location ? 'Hidden' : (profileUser as any).location}</span>
                                </div>
                                <p style={{ marginTop: '0.5rem', color: '#4b5563', maxWidth: '400px', lineHeight: 1.4, fontSize: '0.9rem' }}>{(profileUser as any).bio}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {
                            !isPublic && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                        <PencilSimple size={18} weight="bold" /> Edit Profile
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={logout} style={{ color: '#ef4444' }}>
                                        <SignOut size={18} weight="bold" /> Logout
                                    </Button>
                                </>
                            )
                        }
                        {
                            isPublic && (
                                <Button variant="primary" size="sm" onClick={handleMessage}>
                                    <ChatCircle size={18} weight="bold" /> Message
                                </Button>
                            )
                        }
                    </div>


                    {/* Edit Profile Modal */}
                    {
                        isEditing && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                                <div style={{ width: '89%', maxWidth: '1200px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 'var(--space-8)', overflowY: 'auto', maxHeight: '90vh' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Edit Profile</h3>
                                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={24} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                        {/* Top Section: Photo + Fields */}
                                        <div className="stack-on-mobile" style={{ display: 'flex', gap: '2rem' }}>
                                            {/* Column 1: Profile Photo */}
                                            <div style={{ flex: '0 0 auto', width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', alignSelf: 'flex-start' }}>Profile Photo</label>
                                                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                                    <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                                                        <img src={editForm.image || `https://ui-avatars.com/api/?name=${editForm.name}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    {editForm.image && (
                                                        <div
                                                            onClick={() => {
                                                                setCropTarget('user');
                                                                setCropImage(editForm.image);
                                                            }}
                                                            style={{
                                                                position: 'absolute', bottom: -10, right: -10,
                                                                background: 'white', color: '#374151',
                                                                borderRadius: '50%', width: '32px', height: '32px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', border: '1px solid #e5e7eb',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10
                                                            }}
                                                            title="Crop Photo"
                                                        >
                                                            <Crop size={18} weight="bold" />
                                                        </div>
                                                    )}
                                                </div>
                                                <Button variant="outline" onClick={() => fileInputRef.current?.click()} size="sm" style={{ width: '100%' }}>
                                                    <Camera size={18} /> Change Photo
                                                </Button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleUserFileSelect}
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                />
                                            </div>

                                            {/* Column 2: Grid of Fields */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                {/* Row 1: Name & Username */}
                                                <div className="stack-on-mobile" style={{ display: 'flex', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Name</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.name}
                                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Username</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.username}
                                                            onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                                                            placeholder="@username"
                                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 2: Email & Location */}
                                                <div className="stack-on-mobile" style={{ display: 'flex', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Email</label>
                                                        <input
                                                            type="email"
                                                            value={user?.email || ''}
                                                            readOnly
                                                            disabled
                                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Phone Number <span style={{ color: 'red' }}>*</span></label>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <div style={{ position: 'relative', width: '130px' }}>
                                                                <select
                                                                    value={editForm.country_code}
                                                                    onChange={e => setEditForm({ ...editForm, country_code: e.target.value })}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem 1rem',
                                                                        paddingRight: '2rem',
                                                                        borderRadius: '12px',
                                                                        border: '1px solid #e5e7eb',
                                                                        fontSize: '1rem',
                                                                        background: '#f9fafb',
                                                                        appearance: 'none',
                                                                        WebkitAppearance: 'none',
                                                                        cursor: 'pointer',
                                                                        color: '#374151'
                                                                    }}
                                                                >
                                                                    {COUNTRY_CODES.map(c => (
                                                                        <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                                                                    ))}
                                                                </select>
                                                                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', display: 'flex' }}>
                                                                    <CaretDown size={14} weight="bold" />
                                                                </div>
                                                            </div>

                                                            <input
                                                                type="tel"
                                                                value={editForm.phone_number}
                                                                onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                                                                placeholder="1234567890"
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '0.75rem 1rem',
                                                                    borderRadius: '12px',
                                                                    border: '1px solid #e5e7eb',
                                                                    fontSize: '1rem',
                                                                    background: '#f9fafb'
                                                                }}
                                                                onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = 'var(--primary-300)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-50)'; }}
                                                                onBlur={e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row 3: Location */}
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Location</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                type="text"
                                                                value={editForm.location}
                                                                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                                disabled={isLoadingLocation}
                                                            />
                                                            <button
                                                                onClick={handleGetLocation}
                                                                disabled={isLoadingLocation}
                                                                type="button"
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: '8px',
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
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
                                                    </div>
                                                </div>

                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', cursor: 'pointer', fontSize: '0.875rem', color: '#4b5563' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.show_location}
                                                        onChange={e => setEditForm(prev => ({ ...prev, show_location: e.target.checked }))}
                                                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                                                    />
                                                    Show my location on public pet profiles
                                                </label>
                                            </div>
                                        </div>

                                        {/* Bottom Section: Bio */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Bio</label>
                                            <textarea
                                                value={editForm.bio}
                                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '80px', fontSize: '1rem', lineHeight: 1.5, resize: 'vertical' }}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button variant="primary" onClick={handleSaveProfile}>Save Changes</Button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Edit Pet Modal */}
                    {
                        editingPet && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                                <div style={{ width: '90%', maxWidth: '500px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Edit Pet Details</h3>
                                        <button onClick={() => setEditingPet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={24} /></button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>

                                        {/* Image Upload */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', border: '3px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                    <img src={editingPet.image || `https://ui-avatars.com/api/?name=${editingPet.name}`} alt="Pet Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                {editingPet.image && (
                                                    <div
                                                        onClick={() => {
                                                            setCropTarget('pet');
                                                            setCropImage(editingPet.image);
                                                        }}
                                                        style={{
                                                            position: 'absolute', bottom: 0, right: 0,
                                                            background: 'white', color: '#374151',
                                                            borderRadius: '50%', width: '32px', height: '32px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer', border: '1px solid #e5e7eb',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                        title="Crop Photo"
                                                    >
                                                        <Crop size={16} weight="bold" />
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="outline" onClick={() => petFileInputRef.current?.click()} size="sm">
                                                <Camera size={18} /> Change Photo
                                            </Button>
                                            <input
                                                type="file"
                                                ref={petFileInputRef}
                                                onChange={handlePetFileSelect}
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Name</label>
                                            <input
                                                type="text"
                                                value={editingPet.name}
                                                onChange={e => setEditingPet({ ...editingPet, name: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                            />
                                        </div>

                                        {/* Breed & Age Row */}
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Breed</label>
                                                <input
                                                    type="text"
                                                    value={editingPet.breed}
                                                    onChange={e => setEditingPet({ ...editingPet, breed: e.target.value })}
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Age</label>
                                                <input
                                                    type="text"
                                                    value={editingPet.age}
                                                    onChange={e => setEditingPet({ ...editingPet, age: e.target.value })}
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
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
                                                        onClick={() => setEditingPet({ ...editingPet, gender: g })}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            border: `1px solid ${editingPet.gender === g ? 'var(--primary-600)' : '#d1d5db'}`,
                                                            background: editingPet.gender === g ? 'var(--primary-50)' : 'white',
                                                            color: editingPet.gender === g ? 'var(--primary-700)' : '#374151',
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
                                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                />
                                                <Button onClick={handleAddTrait} variant="outline" size="sm">Add</Button>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {editingPet.traits?.map((trait: string, i: number) => (
                                                    <div key={i} style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                                value={editingPet.bio || ''}
                                                onChange={e => setEditingPet({ ...editingPet, bio: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '80px', fontSize: '1rem', lineHeight: 1.5, resize: 'vertical' }}
                                            />
                                        </div>

                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <Button variant="ghost" onClick={() => setEditingPet(null)}>Cancel</Button>
                                        <Button variant="primary" onClick={handleSavePet}>Save Changes</Button>
                                    </div>
                                </div>
                            </div>
                        )
                    }




                    {/* End of Header Flex */}
                </div>

                {/* Tabs & Content */}
                <div style={{ maxWidth: '1000px', margin: '0.5rem auto 2rem', padding: '0 2rem' }}>

                    {/* Responsive Styles */}
                    <style>
                        {`
                        @media (max-width: 768px) {
                            .mobile-fab {
                                position: fixed !important;
                                bottom: 2rem !important;
                                right: 1.5rem !important;
                                z-index: 50 !important;
                                border-radius: 9999px !important;
                                padding: 1rem !important;
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                                margin: 0 !important;
                            }
                            .mobile-fab span { display: none; } /* Hide text on mobile */
                        }
                    `}
                    </style>

                    {/* Tab Navigation & Action - Integrated Row */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: '1.5rem',
                        borderBottom: '1px solid #e5e7eb',
                        overflowX: 'auto'
                    }}>
                        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '-1px', paddingRight: '1rem', flex: 1 }}>
                            {
                                ['pets', 'matches', 'likes', 'collections', 'dates'].map((tab) => (
                                    (!isPublic || (tab !== 'matches' && tab !== 'likes' && tab !== 'dates')) && ( // Hide private tabs on public profile
                                        <button
                                            key={tab}
                                            onClick={() => setSearchParams({ tab })}
                                            style={{
                                                padding: '0.75rem 0',
                                                background: 'none',
                                                border: 'none',
                                                borderBottom: activeTab === tab ? '2px solid #111827' : '2px solid transparent',
                                                color: activeTab === tab ? '#111827' : '#9ca3af',
                                                fontSize: '1rem',
                                                fontWeight: activeTab === tab ? 600 : 500,
                                                cursor: 'pointer',
                                                textTransform: 'capitalize',
                                                transition: 'color 0.2s',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0
                                            }}
                                        >
                                            {tab === 'pets' ? (isPublic ? `${profileUser.name}'s Pets` : 'My Pets') : tab}
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px', color: '#6b7280' }}>
                                                {tab === 'pets' ? userPets.length : tab === 'matches' ? myMatches.length : tab === 'likes' ? myLikes.length : tab === 'dates' ? (dateRequests.length + myRelationships.length) : collections.length}
                                            </span>
                                        </button>
                                    )))
                            }
                        </div>

                        {/* Add Pet Button */}
                        {
                            !isPublic && activeTab === 'pets' && (
                                <div className="mobile-fab" style={{ marginBottom: '0.5rem' }}>
                                    <Button onClick={handleAddPet} size="sm" variant="primary" style={{ borderRadius: 'var(--radius-full)' }}>
                                        <Plus weight="bold" size={20} /> <span style={{ marginLeft: '0.5rem' }}>Add New Pet</span>
                                    </Button>
                                </div>
                            )
                        }
                    </div>

                    {/* Tab Content */}
                    <div style={{ minHeight: '300px' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>

                            {activeTab === 'pets' && (
                                userPets.length > 0 ? (
                                    userPets.map((pet: any, index: number) => (
                                        <div key={index} style={{ height: '320px', width: '240px', margin: '0 auto' }}>
                                            <Card padding="0" style={{
                                                borderRadius: '24px',
                                                border: 'none',
                                                boxShadow: 'var(--shadow-md)',
                                                overflow: 'hidden',
                                                background: 'var(--gray-900)',
                                                height: '100%',
                                                position: 'relative',
                                                display: 'block'
                                            }}>
                                                <Link to={`/pet/${pet.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                                    <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
                                                </Link>

                                                {/* Owner Actions: Edit / Delete */}
                                                {!isPublic && pet.id && (
                                                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPet(pet); }}
                                                            style={{
                                                                width: '36px', height: '36px', borderRadius: '50%',
                                                                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                                                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#2563eb', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                            }}
                                                        >
                                                            <PencilSimple size={18} weight="bold" />
                                                        </button>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault(); e.stopPropagation();
                                                                if (confirm(`Delete ${pet.name}?`)) {
                                                                    await petService.deletePet(pet.id);
                                                                    setPets(prev => prev.filter(p => p.id !== pet.id));
                                                                }
                                                            }}
                                                            style={{
                                                                width: '36px', height: '36px', borderRadius: '50%',
                                                                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                                                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                            }}
                                                        >
                                                            <Trash size={18} weight="bold" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 10, pointerEvents: 'none' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                                        {pet.gender || 'Unknown Gender'}
                                                    </div>
                                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontFamily: '"Outfit", sans-serif', lineHeight: 1.1 }}>{pet.name}</h3>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 500 }}>
                                                        <span>{pet.breed}</span>
                                                        <span style={{ opacity: 0.6 }}>•</span>
                                                        <span>{pet.age}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '16px' }}>
                                        <p>{isPublic ? 'No pets found.' : "You haven't added any pets yet."}</p>
                                        {!isPublic && <Button variant="ghost" onClick={handleAddPet} style={{ marginTop: '0.5rem', color: '#2563eb' }}>Add one now</Button>}
                                    </div>
                                )
                            )}

                            {(activeTab === 'matches' || activeTab === 'likes') && (
                                (activeTab === 'matches' ? myMatches : myLikes).map((pet) => (
                                    <div key={pet.id} style={{ height: '320px', width: '240px', margin: '0 auto' }}>
                                        <Card padding="0" style={{
                                            borderRadius: '24px',
                                            border: 'none',
                                            boxShadow: 'var(--shadow-md)',
                                            overflow: 'hidden',
                                            background: 'var(--gray-900)',
                                            height: '100%',
                                            position: 'relative',
                                            display: 'block'
                                        }}>
                                            <Link to={`/pet/${pet.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                                <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
                                            </Link>

                                            {/* Top Left: Distance */}
                                            <div style={{
                                                position: 'absolute', top: '12px', left: '12px',
                                                background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)',
                                                padding: '6px 12px', borderRadius: '20px',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10
                                            }}>
                                                <MapPin weight="fill" size={14} color="var(--primary-600)" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                                                    {pet.distance || 'Unknown'}
                                                </span>
                                            </div>

                                            {/* Top Right Actions */}
                                            {activeTab === 'matches' && (
                                                <Link to="/messages" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#2563eb', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                    }}>
                                                        <ChatCircle size={18} weight="bold" />
                                                    </div>
                                                </Link>
                                            )}
                                            {activeTab === 'likes' && (
                                                <div style={{
                                                    position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#ec4899', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                }}>
                                                    <Heart weight="fill" size={18} />
                                                </div>
                                            )}

                                            <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 10, pointerEvents: 'none' }}>
                                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                                    {pet.gender || 'Unknown Gender'}
                                                </div>
                                                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontFamily: '"Outfit", sans-serif', lineHeight: 1.1 }}>{pet.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 500 }}>
                                                    <span>{pet.breed}</span>
                                                    <span style={{ opacity: 0.6 }}>•</span>
                                                    <span>{pet.age}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                ))
                            )}

                            {activeTab === 'collections' && (
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {collections.length > 0 ? collections.map((col: Collection) => (
                                        <div
                                            key={col.id}
                                            onClick={() => setSearchParams({ tab: 'collections', collectionId: String(col.id) })}
                                            style={{
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={{ padding: '1.5rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '12px', color: '#4b5563' }}>
                                                        <Folder size={28} weight="fill" />
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>{col.name}</h3>
                                                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                            {col.items?.length || 0} {(col.items?.length || 0) === 1 ? 'pet' : 'pets'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ color: '#9ca3af' }}>
                                                    <CaretRight size={20} weight="bold" />
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', background: '#f9fafb', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
                                            <p style={{ fontWeight: 500 }}>No collections created yet.</p>
                                            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Go to a pet profile and click the bookmark icon to start one!</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Collection Details Modal */}
                            {expandedCollectionId && (() => {
                                const selectedCol = collections.find(c => c.id === Number(expandedCollectionId));
                                if (!selectedCol) return null;
                                return (
                                    <div style={{
                                        position: 'fixed',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.7)',
                                        backdropFilter: 'blur(4px)',
                                        zIndex: 2000,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{
                                            width: '90%',
                                            height: '90%',
                                            background: 'white',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                        }}>
                                            {/* Modal Header */}
                                            <div style={{
                                                padding: '1.5rem 2rem',
                                                borderBottom: '1px solid #e5e7ebff',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: 'white',
                                                flexShrink: 0
                                            }}>
                                                {/* Left: Back Button */}
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setSearchParams({ tab: 'collections' })}
                                                    style={{
                                                        border: '1px solid #e5e7eb',
                                                        background: 'white',
                                                        color: '#374151',
                                                        borderRadius: '99px',
                                                        padding: '0.5rem 1.25rem',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = '#f9fafb';
                                                        e.currentTarget.style.borderColor = '#d1d5db';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = 'white';
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                    }}
                                                >
                                                    <CaretLeft size={18} weight="bold" style={{ marginRight: '6px' }} /> Back
                                                </Button>

                                                {/* Center: Title */}
                                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                                                    {selectedCol.name}
                                                </h2>

                                                {/* Right: Options (Delete) */}
                                                <Button
                                                    onClick={async () => {
                                                        if (confirm(`Are you sure you want to delete collection "${selectedCol.name}"?`)) {
                                                            await featureService.deleteCollection(selectedCol.id);
                                                            setCollections(prev => prev.filter(c => c.id !== selectedCol.id));
                                                            setSearchParams({ tab: 'collections' });
                                                        }
                                                    }}
                                                    style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}
                                                >
                                                    <Trash size={20} weight="bold" /> Delete
                                                </Button>
                                            </div>

                                            {/* Modal Body: Grid */}
                                            <div style={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                padding: '2rem',
                                                background: '#f9fafb'
                                            }}>
                                                {selectedCol.items && selectedCol.items.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
                                                        {collectionPets.filter(p => selectedCol.items?.includes(p.id)).map((pet: any) => (
                                                            <div key={pet.id} style={{
                                                                position: 'relative',
                                                                height: '320px',
                                                                width: '240px',
                                                                margin: '0 auto',
                                                                borderRadius: '24px',
                                                                overflow: 'hidden',
                                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                                background: 'var(--gray-900)'
                                                            }}>
                                                                {/* Image */}
                                                                <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />

                                                                {/* Remove Button */}
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm(`Remove ${pet.name} from this collection?`)) {
                                                                            await featureService.removeFromCollection(selectedCol.id, pet.id);
                                                                            setCollections(prev => prev.map(c => {
                                                                                if (c.id === selectedCol.id) {
                                                                                    return { ...c, items: c.items?.filter(id => id !== pet.id) };
                                                                                }
                                                                                return c;
                                                                            }));
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute', top: '12px', right: '12px',
                                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                                                                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        color: '#ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10
                                                                    }}
                                                                >
                                                                    <Trash size={16} weight="bold" />
                                                                </button>

                                                                {/* Content */}
                                                                <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 10, pointerEvents: 'none' }}>
                                                                    <Link to={`/pet/${pet.id}`} style={{ textDecoration: 'none', pointerEvents: 'auto' }}>
                                                                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                                                            {pet.gender || 'Unknown'}
                                                                        </div>
                                                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontFamily: '"Outfit", sans-serif', lineHeight: 1.1 }}>{pet.name}</h3>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 500 }}>
                                                                            <span>{pet.breed}</span>
                                                                            <span style={{ opacity: 0.6 }}>•</span>
                                                                            <span>{pet.age}</span>
                                                                        </div>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                        <Folder size={48} weight="duotone" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                                        <p style={{ fontSize: '1.125rem' }}>This collection is empty.</p>
                                                    </div>
                                                )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}



                            {/* DATES TAB - Organized by Pet */}
                            {activeTab === 'dates' && !isPublic && (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', gridColumn: '1 / -1' }}>
                                    {userPets.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '24px', border: '1px solid #e5e7eb' }}>
                                            <PawPrint size={48} weight="duotone" color="#9ca3af" style={{ marginBottom: '1rem' }} />
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>No pets yet</h3>
                                            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Add a pet to start dating!</p>
                                            <Button onClick={handleAddPet} variant="primary" style={{ marginTop: '1.5rem' }}>Add Pet</Button>
                                        </div>
                                    ) : (
                                        userPets.map(pet => {
                                            const petRequests = dateRequests.filter(r => r.target_pet_id === pet.id);
                                            const relationship = myRelationships.find(r => r.myPet.id === pet.id);

                                            return (
                                                <div key={pet.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                                    {/* Pet Header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
                                                        <img src={pet.image} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{pet.name}'s Dating</h3>
                                                        {!relationship && petRequests.length === 0 && (
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>• Single</span>
                                                        )}
                                                    </div>

                                                    <Card style={{ padding: '2rem', background: 'white', width: '100%' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                                            {/* Relationship Section - Premium Card */}
                                                            {relationship ? (
                                                                <div style={{
                                                                    padding: '2rem',
                                                                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                                                                    borderRadius: '24px',
                                                                    border: '1px solid #fecdd3',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: '2.5rem',
                                                                    position: 'relative',
                                                                    overflow: 'hidden',
                                                                    width: '100%'
                                                                }}>
                                                                    {/* Decorative background heart */}
                                                                    <Heart weight="fill" size={120} color="#e11d48" style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.04, transform: 'rotate(-15deg)' }} />

                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '100%', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                                                                        {/* My Pet */}
                                                                        <div style={{ textAlign: 'center', flex: '1 1 0', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                            <img src={pet.image} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                                            <div style={{ fontWeight: 800, marginTop: '1rem', fontSize: '1.125rem', color: '#111827', width: '100%', wordBreak: 'break-word' }}>{pet.name}</div>
                                                                        </div>

                                                                        {/* Center Heart Badge */}
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                                                            <div style={{
                                                                                background: 'white',
                                                                                padding: '12px',
                                                                                borderRadius: '50%',
                                                                                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}>
                                                                                <Heart weight="fill" size={28} color="#e11d48" className="pulse-animation" />
                                                                            </div>
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#e11d48', letterSpacing: '0.12em', textTransform: 'uppercase' }}>DATING</span>
                                                                        </div>

                                                                        {/* Partner */}
                                                                        <Link to={`/pet/${relationship.partner.id}`} style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', flex: '1 1 0', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                            <img src={relationship.partner.image} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                                            <div style={{ fontWeight: 800, marginTop: '1rem', fontSize: '1.125rem', color: '#111827', width: '100%', wordBreak: 'break-word' }}>{relationship.partner.name}</div>
                                                                        </Link>
                                                                    </div>

                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        style={{
                                                                            borderColor: '#fda4af',
                                                                            color: '#e11d48',
                                                                            background: 'rgba(255, 255, 255, 0.7)',
                                                                            fontWeight: 700,
                                                                            fontSize: '0.875rem',
                                                                            padding: '0.625rem 2rem',
                                                                            borderRadius: '12px',
                                                                            backdropFilter: 'blur(4px)',
                                                                            zIndex: 2,
                                                                            transition: 'all 0.2s',
                                                                            marginTop: '0.5rem'
                                                                        }}
                                                                        onClick={() => handleBreakUp(pet.id)}
                                                                    >
                                                                        End Relationship
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                !petRequests.length && (
                                                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '1rem', background: '#f9fafb', borderRadius: '16px' }}>
                                                                        No active relationship.
                                                                    </div>
                                                                )
                                                            )}

                                                            {/* Requests Section */}
                                                            {petRequests.length > 0 && (
                                                                <div style={{ borderTop: relationship ? '1px solid #f3f4f6' : 'none', paddingTop: relationship ? '2rem' : '0' }}>
                                                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#4b5563', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                        Pending Requests ({petRequests.length})
                                                                    </h4>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                                        {petRequests.map(req => (
                                                                            <div key={req.id} style={{ padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#f9fafb', width: '100%', flexWrap: 'wrap' }}>
                                                                                <Link to={`/pet/${req.requester.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: '200px' }}>
                                                                                    <img src={req.requester.image} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                                                                                    <div>
                                                                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{req.requester.name}</div>
                                                                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>wants to date</div>
                                                                                    </div>
                                                                                </Link>
                                                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                                                    <Button size="sm" variant="primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '12px' }} onClick={() => handleAcceptDate(req.id)}>Accept</Button>
                                                                                    <Button size="sm" variant="outline" style={{ padding: '0.5rem 1.5rem', borderRadius: '12px' }} onClick={() => handleRejectDate(req.id)}>Reject</Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
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
                </div>
            </div>
        </div>
    );
};

export default Profile;
