import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { MapPin, PencilSimple, SignOut, Plus, Heart, ChatCircle, X, Trash, CaretLeft } from '@phosphor-icons/react';

import { featureService } from '../lib/featureService';
import type { Collection } from '../lib/featureService';
import { Folder, CaretRight, Camera } from '@phosphor-icons/react';
import { processImage } from '../utils/imageHandler';

import { petService } from '../lib/petService';
import { userService } from '../lib/userService';

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // 'id' contains the username for public profile
    const [searchParams, setSearchParams] = useSearchParams();


    // Public vs Private Mode Logic
    const isPublic = !!id; // If ID exists, it's public

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.name || '',
        location: '',
        bio: '',
        image: user?.image || ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await processImage(e.target.files[0]);
                setEditForm(prev => ({ ...prev, image: base64 }));
            } catch (err) {
                console.error("Image processing failed", err);
                alert("Failed to process image.");
            }
        }
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
    const [likedPets, setLikedPets] = useState<any[]>([]);
    const [matchedPets, setMatchedPets] = useState<any[]>([]);
    const [collectionPets, setCollectionPets] = useState<any[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!isPublic && user) {
                // Private View: Load own data
                const [userPets, userCols, userProfile] = await Promise.all([
                    petService.getUserPets(user.id),
                    featureService.getCollections(user.id),
                    userService.getProfile(user.id)
                ]);

                setPets(userPets || []);
                setCollections(userCols);
                setProfileData(userProfile);

                // Load likes/matches
                const [likeIds, matchIds] = await Promise.all([
                    featureService.getLikes(user.id),
                    featureService.getMatches(user.id)
                ]);

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

                // Initialize form
                if (userProfile) {
                    setEditForm({
                        name: userProfile.name || '',
                        location: userProfile.location || '',
                        bio: userProfile.bio || '',
                        image: userProfile.avatar_url || ''
                    });
                }

            } else if (isPublic && id) {
                // Public View: Load other user's data
                // 'id' is the profile ID (UUID)
                const [targetProfile, targetPets] = await Promise.all([
                    userService.getProfile(id),
                    petService.getUserPets(id)
                ]);

                setProfileData(targetProfile);
                setPets(targetPets || []);
                setLikedPets([]);
                setMatchedPets([]);
                setCollectionPets([]);
            }
        };
        loadData();
    }, [user, isPublic, id]);

    // Derived for rendering
    const myMatches = matchedPets;
    const myLikes = likedPets;
    const userPets = pets;

    // Derived Data
    // Use fetched profile data if available, otherwise fall back to auth user (private) or simple placeholder (public)
    const profileUser = profileData || (
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
        navigate('/onboarding?step=2');
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        try {
            // Update DB
            await userService.updateProfile(user.id, {
                name: editForm.name,
                avatar_url: editForm.image, // Ensure mapping matches DB column 'avatar_url'
                location: editForm.location,
                bio: editForm.bio
            });

            // Update Auth Context (for app-wide name/image)
            updateUser({ name: editForm.name, image: editForm.image });

            // Force reload to refresh data
            setIsEditing(false);
            window.location.reload();
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to save profile changes.");
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)' }}>

            {/* Minimalist Header */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>

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
                        </div >

                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, color: '#111827' }}>{profileUser.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                <MapPin weight="fill" color="#9ca3af" size={16} />
                                <span>{(profileUser as any).location}</span>
                            </div>
                            <p style={{ marginTop: '0.5rem', color: '#4b5563', maxWidth: '400px', lineHeight: 1.4, fontSize: '0.9rem' }}>{(profileUser as any).bio}</p>
                        </div>
                    </div >

                    {/* Actions */}
                    {
                        !isPublic && (
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <PencilSimple size={18} weight="bold" /> Edit Profile
                                </Button>
                                <Button variant="ghost" size="sm" onClick={logout} style={{ color: '#ef4444' }}>
                                    <SignOut size={18} weight="bold" /> Logout
                                </Button>
                            </div>
                        )
                    }

                    {/* Edit Modal */}
                    {
                        isEditing && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                                <div style={{ width: '90%', maxWidth: '500px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Edit Profile</h3>
                                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={24} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Name</label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Location</label>
                                            <input
                                                type="text"
                                                value={editForm.location}
                                                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Profile Photo</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6' }}>
                                                    <img src={editForm.image || `https://ui-avatars.com/api/?name=${editForm.name}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <Button variant="outline" onClick={() => fileInputRef.current?.click()} size="sm">
                                                    <Camera size={18} /> Change Photo
                                                </Button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileSelect}
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Bio</label>
                                            <textarea
                                                value={editForm.bio}
                                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '100px', fontSize: '1rem', lineHeight: 1.5, resize: 'vertical' }}
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

                    {/* Optional: Message button for Public Profile */}
                    {
                        isPublic && (
                            <Link to="/messages">
                                <Button variant="primary" size="sm">
                                    <ChatCircle size={18} weight="bold" /> Message
                                </Button>
                            </Link>
                        )
                    }
                </div >
            </div >

            {/* Tabs & Content */}
            < div style={{ maxWidth: '1000px', margin: '0.5rem auto 2rem', padding: '0 2rem' }}>

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
                            ['pets', 'matches', 'likes', 'collections'].map((tab) => (
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
                                        {tab === 'pets' ? userPets.length : tab === 'matches' ? myMatches.length : tab === 'likes' ? myLikes.length : collections.length}
                                    </span>
                                </button>
                            ))
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
                < div style={{ minHeight: '300px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>

                        {activeTab === 'pets' && (
                            userPets.length > 0 ? (
                                userPets.map((pet: any, index: number) => (
                                    <Card key={index} padding="0" style={{ overflow: 'hidden', border: 'none', boxShadow: 'none' }}>
                                        <div style={{ aspectRatio: '4/3', width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                                            {/* Link to pet profile only if it has an ID (mock pets), newly created private pets might not have ID yet if not connected to DB */}
                                            {pet.id ? (
                                                <Link to={`/pet/${pet.id}`}>
                                                    <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </Link>
                                            ) : (
                                                <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                        <div style={{ paddingTop: '1rem' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{pet.name}</h3>
                                            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{pet.breed}, {pet.age} yrs</p>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '16px' }}>
                                    <p>{isPublic ? 'No pets found.' : "You haven't added any pets yet."}</p>
                                    {!isPublic && <Button variant="ghost" onClick={handleAddPet} style={{ marginTop: '0.5rem', color: '#2563eb' }}>Add one now</Button>}
                                </div>
                            )
                        )}

                        {(activeTab === 'matches' || activeTab === 'likes') && (
                            // In public view, maybe hide matches/likes for privacy? Or show mock for demo? Showing mock for consistency with request "functional buttons"
                            (activeTab === 'matches' ? myMatches : myLikes).map((pet) => (
                                <div key={pet.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Card padding="0" style={{ overflow: 'hidden', border: 'none', boxShadow: 'none' }}>
                                        <Link to={`/pet/${pet.id}`} style={{ display: 'block', aspectRatio: '4/3', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </Link>
                                        <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{pet.name}</h3>
                                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{pet.breed}</p>
                                            </div>
                                            {activeTab === 'matches' && (
                                                <Link to="/messages">
                                                    <Button variant="outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ChatCircle size={20} weight="bold" />
                                                    </Button>
                                                </Link>
                                            )}
                                            {activeTab === 'likes' && (
                                                <div style={{ color: '#ec4899' }}>
                                                    <Heart weight="fill" size={24} />
                                                </div>
                                            )}
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
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                                    {collectionPets.filter(p => selectedCol.items?.includes(p.id)).map((pet: any) => (
                                                        <div key={pet.id} style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            background: 'white',
                                                            borderRadius: '20px',
                                                            overflow: 'hidden',
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                                            cursor: 'default'
                                                        }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                                            }}
                                                        >
                                                            {/* Image Header */}
                                                            <div style={{ aspectRatio: '4/3', width: '100%', position: 'relative' }}>
                                                                <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '20px', color: '#111827', fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                                    {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}
                                                                </div>
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm(`Remove ${pet.name} from this collection?`)) {
                                                                            await featureService.removeFromCollection(selectedCol.id, pet.id);
                                                                            // Update state
                                                                            setCollections(prev => prev.map(c => {
                                                                                if (c.id === selectedCol.id) {
                                                                                    return { ...c, items: c.items?.filter(id => id !== pet.id) };
                                                                                }
                                                                                return c;
                                                                            }));
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '12px',
                                                                        right: '12px',
                                                                        background: 'rgba(255,255,255,0.9)',
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '50%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        color: '#ef4444',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                        transition: 'background 0.2s'
                                                                    }}
                                                                    title="Remove from collection"
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
                                                                >
                                                                    <Trash size={16} weight="bold" />
                                                                </button>
                                                            </div>

                                                            {/* Body */}
                                                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{pet.name}</h3>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', background: '#fffbeb', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                                                                        <Heart size={12} weight="fill" />
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>98%</span>
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                                                                    <span>{pet.breed}</span>
                                                                    <span>•</span>
                                                                    <span>{pet.age}</span>
                                                                </div>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                                                                    <MapPin size={16} weight="fill" color="#9ca3af" />
                                                                    <span>{pet.distance || 'Near you'}</span>
                                                                </div>

                                                                <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                                                    {pet.bio || pet.description || "A lovely pet looking for a home."}
                                                                </p>

                                                                <div style={{ marginTop: '1.5rem' }}>
                                                                    <Link to={`/pet/${pet.id}`}>
                                                                        <Button variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                                                                            View Profile
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                    <Folder size={48} weight="duotone" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                                    <p style={{ fontSize: '1.125rem' }}>This collection is empty.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                    </div>
                </div >
            </div >
        </div >
    );
};

export default Profile;
