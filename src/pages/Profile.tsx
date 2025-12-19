import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { MapPin, PencilSimple, SignOut, Plus, Heart, ChatCircle, X, Trash, CaretLeft } from '@phosphor-icons/react';
import { MOCK_PETS } from '../data/mockPets';
import { getLikes, getMatches, getAllPets, getCollections, deleteCollection, removeFromCollection } from '../utils/storage';
import type { Collection } from '../utils/storage';
import { Folder, CaretRight, Camera } from '@phosphor-icons/react';
import { processImage } from '../utils/imageHandler';

import { petService } from '../lib/petService';

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // 'id' contains the username for public profile
    const [searchParams, setSearchParams] = useSearchParams();
    const [_, setTick] = useState(0);

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

    // Read extended profile from localStorage (ONLY for private)
    const profileKey = user ? `petmatch_profile_${user.id} ` : null;
    const savedProfile = (!isPublic && profileKey) ? localStorage.getItem(profileKey) : null;
    const privateProfileData = savedProfile ? JSON.parse(savedProfile) : { pets: [] };

    // Initialize form with saved data on load
    useEffect(() => {
        if (!isPublic && user) {
            setEditForm({
                name: user.name,
                image: user.image || '',
                location: privateProfileData.location || 'New York, NY',
                bio: privateProfileData.bio || 'Pet lover and outdoor enthusiast.',
            });
        }
    }, [user?.id, isPublic]);

    // If public, 'user' is the profile being viewed (mocked). If private, it's the auth user.
    const profileUser = isPublic
        ? { name: id, location: 'San Francisco, CA', bio: `Just another pet lover named ${id}.`, image: undefined }
        : { ...user, location: privateProfileData.location || 'New York, NY', bio: privateProfileData.bio || 'Pet lover...', image: user?.image };

    // Tabs State (Derived from URL)
    const activeTab = searchParams.get('tab') || 'pets';

    // Collection State (Derived from URL)
    const expandedCollectionId = searchParams.get('collectionId');

    // Derived Data
    const likes = (user && !isPublic) ? getLikes(user.id) : [];
    const matches = (user && !isPublic) ? getMatches(user.id) : [];
    const collections = (user && !isPublic) ? getCollections(user.id) : [];

    // Async Pets State
    const [pets, setPets] = useState<any[]>([]);

    useEffect(() => {
        const fetchPets = async () => {
            if (!isPublic && user) {
                const data = await petService.getUserPets(user.id);
                setPets(data || []);
            } else if (isPublic && id) {
                // Determine if we can fetch by owner name or need to fetch all
                // For now fetch all and filter client side for legacy compatibility
                const all = await petService.getAllPets('PUBLIC_VIEW');
                // Filter by owner_id (UUID) or legacy owner (name string)
                setPets((all as any[]).filter(p => p.owner_id === id || p.owner === id));
            }
        };
        fetchPets();
    }, [user, isPublic, id]);


    // Filter pets based on tab
    const userPets = pets; // Now uses state

    const myMatches = (!isPublic && user)
        ? getAllPets().filter(p => matches.includes(p.id)) // Keep using sync for matches logic to avoid breakage for now
        : MOCK_PETS.slice(0, 3);

    // Use real likes for the Likes tab
    const myLikes = (!isPublic && user)
        ? getAllPets().filter(p => likes.includes(p.id))
        : MOCK_PETS.slice(2, 5);

    const handleAddPet = () => {
        navigate('/onboarding?step=2');
    };

    const handleSaveProfile = () => {
        // 1. Update Core User (Name, Image)
        if (user) {
            updateUser({ name: editForm.name, image: editForm.image });
        }

        // 2. Update Extended Profile (Location, Bio) - Merge with existing pets
        const updatedProfile = {
            ...privateProfileData,
            location: editForm.location,
            bio: editForm.bio
        };
        if (profileKey) {
            localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
        }

        setIsEditing(false);
        // Force reload or just rely on react state updates? 
        // AuthContext update triggers re-render of 'user'. 
        // LocalStorage update might not trigger re-render of 'privateProfileData' unless we track it in state.
        // For simplicity, we'll reload window or use a state for profileData. 
        // Let's us window.location.reload() for a hard sync or update a local version.
        // For simplicity, we'll reload window or update a local version. 
        // Let's use window.location.reload() for a hard sync or update a local version.
        window.location.reload();
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-app)' }}>

            {/* Minimalist Header */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>

                    {/* User Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div
                            onClick={!isPublic ? () => setIsEditing(true) : undefined}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: '#f3f4f6',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: !isPublic ? 'pointer' : 'default',
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
                                        <PencilSimple color="white" weight="bold" size={24} />
                                    </div>
                                )
                            }
                        </div >

                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, color: '#111827' }}>{profileUser.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.95rem' }}>
                                <MapPin weight="fill" color="#9ca3af" />
                                <span>{(profileUser as any).location}</span>
                            </div>
                            <p style={{ marginTop: '0.75rem', color: '#4b5563', maxWidth: '400px', lineHeight: 1.5 }}>{(profileUser as any).bio}</p>
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
            < div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 2rem' }}>

                {/* Tab Navigation */}
                < div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
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
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tab === 'pets' ? (isPublic ? `${profileUser.name}'s Pets` : 'My Pets') : tab}
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px', color: '#6b7280' }}>
                                    {tab === 'pets' ? userPets.length : tab === 'matches' ? myMatches.length : tab === 'likes' ? myLikes.length : collections.length}
                                </span>
                            </button>
                        ))
                    }
                </div >

                {/* Tab Content */}
                < div style={{ minHeight: '300px' }}>

                    {/* Add Pet Button (Only on Private Pets tab) */}
                    {
                        !isPublic && activeTab === 'pets' && (
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={handleAddPet} size="sm">
                                    <Plus weight="bold" /> Add New Pet
                                </Button>
                            </div>
                        )
                    }

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>

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
                                                        {col.petIds.length} {col.petIds.length === 1 ? 'pet' : 'pets'}
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
                            const selectedCol = collections.find(c => c.id === expandedCollectionId);
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
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to delete collection "${selectedCol.name}"?`)) {
                                                        deleteCollection(user!.id, selectedCol.id);
                                                        setTick(t => t + 1);
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
                                            {selectedCol.petIds.length > 0 ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                                    {getAllPets().filter(p => selectedCol.petIds.includes(p.id)).map((pet: any) => (
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
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm(`Remove ${pet.name} from this collection?`)) {
                                                                            removeFromCollection(user!.id, selectedCol.id, pet.id);
                                                                            setTick(t => t + 1);
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
