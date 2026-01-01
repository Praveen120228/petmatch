import { useEffect, useState } from 'react';
import { X, Heart, User, Eye, Trash } from '@phosphor-icons/react'; // Phosphor icons
import { postService } from '../lib/postService';
import type { Post } from '../lib/postService';
import { useAuth } from '../context/AuthContext';
// import Button from './Button'; // Removed unused import

interface PostDetailModalProps {
    post: Post;
    isOpen: boolean;
    onClose: () => void;
    onLikeToggle?: (postId: string, newStatus: boolean) => void;
    onDelete?: (postId: string) => void;
}

const PostDetailModal = ({ post, isOpen, onClose, onLikeToggle, onDelete }: PostDetailModalProps) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.liked_by_me);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [viewsCount, setViewsCount] = useState(post.views_count || 0);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Increment view count
            postService.incrementView(post.id);
            setViewsCount(prev => prev + 1);

            // Reset local state from props when opened (handles props updates if cycled)
            setIsLiked(post.liked_by_me);
            setLikesCount(post.likes_count);
        }
    }, [isOpen, post.id]); // Run when modal opens or post ID changes

    if (!isOpen) return null;

    const handleLike = async () => {
        if (!user) return alert("Please login to like posts");

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 300);

        try {
            await postService.toggleLike(user.id, post.id, !newLikedState);
            if (onLikeToggle) onLikeToggle(post.id, newLikedState);
        } catch (error) {
            console.error(error);
            setIsLiked(!newLikedState);
            setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                if (onDelete) await onDelete(post.id);
                onClose();
            } catch (error) {
                console.error("Failed to delete post", error);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div style={{
                width: '90%',
                maxWidth: '1000px',
                height: '90vh', // Large modal
                maxHeight: '800px',
                backgroundColor: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                {/* Close Button Mobile / Desktop Overlay */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        left: '15px', // Left for better reachability on mobile sometimes, or standard right
                        zIndex: 20,
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} weight="bold" />
                </button>


                {/* Layout: Image Left (or Top on mobile), Details Right (or Bottom) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    height: '100%',
                    flexWrap: 'wrap' // Wrap for mobile
                }}>

                    {/* Image Section */}
                    <div style={{
                        flex: '1 1 60%', // Takes 60% width on desktop
                        minWidth: '300px',
                        background: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        height: '100%' // Full height
                    }} onDoubleClick={handleLike}>
                        <img
                            src={post.image_url}
                            alt="Post"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                        {/* Heart Animation */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${isLikeAnimating ? 1 : 0})`,
                            opacity: isLikeAnimating ? 1 : 0,
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            pointerEvents: 'none'
                        }}>
                            <Heart size={100} weight="fill" color="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                        </div>
                    </div>

                    {/* Details Section */}
                    <div style={{
                        flex: '1 1 40%',
                        minWidth: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: '1px solid #e5e7eb',
                        background: 'white',
                        height: '100%'
                    }}>
                        {/* User Header */}
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url}) center/cover` : 'var(--gray-200)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {!post.profiles?.avatar_url && <User size={20} color="gray" />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{post.profiles?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>@{post.profiles?.username || 'user'}</div>
                                </div>
                            </div>

                            {/* Delete Option (if owner) */}
                            {user?.id === post.user_id && onDelete && (
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        background: 'transparent', border: 'none', color: '#ef4444',
                                        cursor: 'pointer', padding: '8px',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        fontSize: '0.85rem', fontWeight: 600
                                    }}
                                >
                                    <Trash size={18} /> Delete
                                </button>
                            )}
                        </div>

                        {/* Comments / Caption Area (Scrollable) */}
                        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                            {post.caption && (
                                <div style={{ marginBottom: '16px' }}>
                                    <span style={{ fontWeight: 700, marginRight: '8px' }}>{post.profiles?.username}</span>
                                    <span style={{ color: '#374151', lineHeight: '1.5' }}>{post.caption}</span>
                                </div>
                            )}

                            {/* Placeholder for comments if we add them later */}
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                                <p>No comments yet.</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button
                                        onClick={handleLike}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        <Heart size={28} weight={isLiked ? 'fill' : 'regular'} color={isLiked ? '#ef4444' : '#1f2937'} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        <div style={{ transform: 'rotateY(180deg)' }}> {/* Chat icon flip */}
                                            {/* Reuse ChatCircle or similar for comment icon */}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                                {likesCount.toLocaleString()} likes
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Eye size={14} weight="bold" />
                                {viewsCount.toLocaleString()} views
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', textTransform: 'uppercase' }}>
                                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailModal;
