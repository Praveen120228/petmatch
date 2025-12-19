import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLikes, toggleLike, getMatches, toggleMatch, getCollections, createCollection, addToCollection, removeFromCollection, deleteCollection } from '../utils/storage';
import { chatService } from '../lib/chatService';
import { petService } from '../lib/petService';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Card from '../components/Card';
import { CaretLeft, Heart, ChatCircle, ShareNetwork, Handshake, BookmarkSimple, X, Plus, Check, Trash } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PetProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [pet, setPet] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    // const [tick, setTick] = useState(0);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    useEffect(() => {
        const loadPet = async () => {
            setLoading(true);
            const p = await petService.getPet(Number(id));
            setPet(p);
            setLoading(false);
        };
        loadPet();

        // Subscribe to updates for this pet
        const channel = supabase
            .channel(`pet_${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pets', filter: `id=eq.${id}` },
                (payload) => {
                    setPet((current: any) => ({ ...current, ...payload.new }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const isLiked = user ? getLikes(user.id).includes(Number(id)) : false;
    const isMatched = user ? getMatches(user.id).includes(Number(id)) : false;
    const collections = user ? getCollections(user.id) : [];

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;

    if (!pet) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2>Pet not found</h2>
                <div onClick={() => navigate(-1)} style={{ display: 'inline-block' }}>
                    <Button variant="primary">Go Back</Button>
                </div>
            </div>
        );
    }

    const handleLike = () => {
        if (!user) {
            showToast("Please login", "error");
            return;
        }
        toggleLike(user.id, pet.id);
        // setTick(t => t + 1);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
    };

    const handleMatch = () => {
        if (!user) {
            showToast("Please login", "error");
            return;
        }
        toggleMatch(user.id, pet.id);
        const isNowMatched = !isMatched; // toggleMatch returns 'is now un-matched' boolean? No, it returns !isMatched.
        if (isNowMatched) showToast("It's a Match!", 'success');
        // setTick(t => t + 1);
    };

    const handleMessage = async () => {
        if (!user) {
            showToast("Please login", "error");
            return;
        }
        try {
            // Need data: pet owner ID.
            // Currently pet.owner is a Name string in mock data.
            // We need `pet.ownerId`.
            if (!pet.ownerId && !pet.owner_id) {
                showToast("Cannot message this pet owner (missing ID)", "error");
                return;
            }
            // Mapped or raw supabase pet?
            const ownerId = pet.ownerId || pet.owner_id;

            const chatId = await chatService.createConversation(user.id, ownerId, pet.id);
            navigate(`/messages/${chatId}`);
        } catch (err) {
            console.error(err);
            showToast("Failed to start chat", "error");
        }
    };

    const handleToggleCollection = (collectionId: string, isAlreadyIn: boolean) => {
        if (!user) return;
        if (isAlreadyIn) {
            removeFromCollection(user.id, collectionId, pet.id);
            showToast(`Removed ${pet.name} from collection.`, 'info');
        } else {
            addToCollection(user.id, collectionId, pet.id);
            showToast(`Added ${pet.name} to collection!`, 'success');
        }
        // setTick(t => t + 1); // Force re-render to update UI
    };

    const handleCreateCollection = () => {
        if (!newCollectionName.trim() || !user) return;
        const newCol = createCollection(user.id, newCollectionName);
        addToCollection(user.id, newCol.id, pet.id);
        showToast(`Created "${newCollectionName}" and added ${pet.name}!`, 'success');
        setShowCollectionModal(false);
        setNewCollectionName('');
        // setTick(t => t + 1);
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'white' }}>
            {/* Header / Nav */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 20 }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div onClick={() => navigate(-1)} style={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <CaretLeft size={24} weight="bold" />
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{pet.name}</h1>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '3rem', alignItems: 'start' }}>

                {/* Left: Photos & Bio */}
                <div>
                    {/* Main Image */}
                    {/* Image Gallery */}
                    <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position: 'relative', background: '#000' }}>
                        {pet.images && pet.images.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                overflowX: 'auto',
                                scrollSnapType: 'x mandatory',
                                height: '100%',
                                scrollbarWidth: 'none' // Firefox
                            }} className="no-scrollbar">
                                {pet.images.map((img: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`${pet.name} ${idx + 1}`}
                                        style={{
                                            flex: '0 0 100%',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            scrollSnapAlign: 'center'
                                        }}
                                    />
                                ))}
                                {/* Photo Counter */}
                                <div style={{
                                    position: 'absolute', bottom: '1rem', right: '1rem',
                                    background: 'rgba(0,0,0,0.6)', color: 'white',
                                    padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                    fontSize: '0.875rem', fontWeight: 600
                                }}>
                                    📷 {pet.images.length}
                                </div>
                            </div>
                        ) : (
                            <img src={pet.image} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                    </div>

                    {/* Bio */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>About {pet.name}</h2>
                        <p style={{ color: '#4b5563', lineHeight: 1.6, fontSize: '1rem' }}>{pet.bio}</p>
                    </div>

                    {/* Traits */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>My Traits</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {pet.traits?.map((trait: string) => (
                                <span key={trait} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', color: '#1f2937', fontWeight: 500 }}>
                                    {trait}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Info Card & Owner */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Pet Quick Info */}
                    <Card style={{ padding: '2rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{pet.name}</h2>
                                <p style={{ color: '#6b7280', fontSize: '1.1rem', marginTop: '0.25rem' }}>{pet.breed}</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {/* Like Button */}
                                <div
                                    onClick={handleLike}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid transparent',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Heart weight={isLiked ? "fill" : "regular"} size={28} color={isLiked ? '#e11d48' : '#374151'} />
                                </div>

                                {/* Bookmark Button */}
                                <div
                                    onClick={() => setShowCollectionModal(true)}
                                    style={{
                                        cursor: 'pointer',
                                        color: '#9ca3af',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        background: '#F9FAFB'
                                    }}
                                >
                                    <BookmarkSimple size={24} weight="regular" />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', padding: '1.5rem 0' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Age</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>{pet.age}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Distance</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>{pet.distance}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Gender</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Male</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Color</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Mixed</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Button variant="primary" style={{ width: '100%', backgroundColor: isMatched ? 'var(--color-accent)' : '#64748b', border: 'none' }} onClick={handleMatch}>
                                <Handshake size={20} weight="bold" /> {isMatched ? 'Matched' : 'Match'}
                            </Button>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="outline" style={{ flex: 1 }} onClick={handleMessage}>
                                    <ChatCircle size={20} weight="bold" /> Message
                                </Button>
                                <Button variant="outline" style={{ padding: '0.75rem' }} onClick={handleShare}>
                                    <ShareNetwork size={20} weight="bold" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Owner Info - Link to Public Profile */}
                    <Link to={`/user/${pet.owner}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6' }}>
                                <img src={`https://ui-avatars.com/api/?name=${pet.owner}&background=random`} alt={pet.owner} style={{ width: '100%', height: '100%' }} />
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Owned by</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>{pet.owner_profile?.name || pet.owner || 'Unknown'}</span>
                            </div>
                        </Card>
                    </Link>

                </div>
            </div>

            {/* Collection Modal */}
            {showCollectionModal && (
                <>
                    <style>
                        {`
                            @keyframes modal-pop {
                                0% { transform: scale(0.95); opacity: 0; }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `}
                    </style>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div style={{
                            background: 'white',
                            padding: '0',
                            borderRadius: '24px',
                            width: '90%',
                            maxWidth: '420px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            animation: 'modal-pop 0.2s ease-out forwards',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Header */}
                            <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Save to Collection</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Select a collection to save {pet.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowCollectionModal(false)}
                                    style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                                >
                                    <X size={20} weight="bold" color="#374151" />
                                </button>
                            </div>

                            {/* List */}
                            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {collections.length > 0 ? collections.map(col => {
                                    const isAdded = col.petIds.includes(pet.id);
                                    return (
                                        <div
                                            key={col.id}
                                            style={{ display: 'flex', gap: '0.5rem', width: '100%' }}
                                        >
                                            <button
                                                onClick={() => handleToggleCollection(col.id, isAdded)}
                                                style={{
                                                    flex: 1,
                                                    padding: '1rem',
                                                    textAlign: 'left',
                                                    background: isAdded ? '#f0fdf4' : 'white',
                                                    border: isAdded ? '2px solid #22c55e' : '2px solid #e5e7eb',
                                                    borderRadius: '16px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={e => !isAdded && (e.currentTarget.style.borderColor = '#d1d5db')}
                                                onMouseLeave={e => !isAdded && (e.currentTarget.style.borderColor = '#e5e7eb')}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '40px', height: '40px',
                                                        borderRadius: '10px',
                                                        background: isAdded ? '#dcfce7' : '#f3f4f6',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: isAdded ? '#166534' : '#6b7280'
                                                    }}>
                                                        {isAdded ? <Check size={20} weight="bold" /> : <BookmarkSimple size={20} weight="fill" />}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                        <span style={{ fontWeight: 700, color: isAdded ? '#166534' : '#1f2937', fontSize: '1rem' }}>{col.name}</span>
                                                        <span style={{ fontSize: '0.8rem', color: isAdded ? '#166534' : '#9ca3af' }}>{col.petIds.length} pets</span>
                                                    </div>
                                                </div>
                                                {isAdded && (
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', background: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #dcfce7' }}>
                                                        SAVED
                                                    </span>
                                                )}
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (user && confirm(`Are you sure you want to delete collection "${col.name}"?`)) {
                                                        deleteCollection(user.id, col.id);
                                                        // setTick(t => t + 1);
                                                    }
                                                }}
                                                style={{
                                                    padding: '0 1rem',
                                                    borderRadius: '16px',
                                                    border: '1px solid #fee2e2',
                                                    background: '#fff',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                                                title="Delete Collection"
                                            >
                                                <Trash size={20} weight="bold" />
                                            </button>
                                        </div>

                                    );
                                }) : (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f9fafb', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
                                        <p style={{ color: '#6b7280', fontWeight: 500 }}>No collections found</p>
                                        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>Create one below to get started</p>
                                    </div>
                                )}
                            </div>


                            {/* Footer / Create New */}
                            <div style={{ padding: '1.5rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Create new collection..."
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '12px',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                                    />
                                    <Button
                                        onClick={handleCreateCollection}
                                        disabled={!newCollectionName.trim()}
                                        style={{ borderRadius: '12px', padding: '0 1.25rem' }}
                                    >
                                        <Plus size={20} weight="bold" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PetProfile;
