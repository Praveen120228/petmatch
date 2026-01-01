import { useEffect, useState, useRef, useCallback } from 'react'; // Added useCallback
import { X, Heart, User, Eye, Trash, CaretDown, CaretUp } from '@phosphor-icons/react';
import { postService } from '../lib/postService';
import type { Post } from '../lib/postService';
import { useAuth } from '../context/AuthContext';

interface PostDetailModalProps {
    posts: Post[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onLikeToggle?: (postId: string, newStatus: boolean) => void;
    onDelete?: (postId: string) => void;
}

const PostDetailModal = ({ posts, initialIndex, isOpen, onClose, onLikeToggle, onDelete }: PostDetailModalProps) => {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());

    // Scroll to initial index on open
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const el = containerRef.current;
            // Immediate scroll without animation to start at right place
            el.scrollTo({ top: initialIndex * el.clientHeight, behavior: 'auto' });
        }
    }, [isOpen]); // Only run when opening

    // Handle View Counting & Index Tracking
    const handleScroll = useCallback(() => { // Wrapped in useCallback
        if (!containerRef.current) return;
        const el = containerRef.current;
        const index = Math.round(el.scrollTop / el.clientHeight);

        if (index !== currentIndex && index >= 0 && index < posts.length) {
            setCurrentIndex(index);
        }
    }, [currentIndex, posts.length]); // Dependencies

    useEffect(() => {
        const el = containerRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll);
            return () => el.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]); // Depend on handleScroll

    // Increment View Effect
    useEffect(() => {
        if (!isOpen || !posts[currentIndex]) return;
        const post = posts[currentIndex];

        if (!viewedPosts.has(post.id)) {
            postService.incrementView(post.id);
            setViewedPosts(prev => new Set(prev).add(post.id));
        }
    }, [currentIndex, isOpen, posts, viewedPosts]);


    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'black', // Immersive background
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Close Button - Fixed Top Right */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 50,
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                <X size={24} weight="bold" />
            </button>

            {/* Main Scroll Container */}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '500px', // Mobile/Story width constraints
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none', // Hide scrollbar Firefox
                    msOverflowStyle: 'none', // Hide scrollbar IE
                    position: 'relative'
                }}
                className="no-scrollbar" // Add global class if needed for hiding scrollbar
            >
                <style>
                    {`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                    `}
                </style>

                {posts.map((post, index) => (
                    <SinglePostSlide
                        key={post.id}
                        post={post}
                        isActive={index === currentIndex}
                        onLikeToggle={onLikeToggle}
                        onDelete={onDelete}
                        currentUser={user}
                    />
                ))}
            </div>
        </div>
    );
};

// Sub-component for individual slide efficiency
const SinglePostSlide = ({ post, isActive, onLikeToggle, onDelete, currentUser }: any) => {
    const [isLiked, setIsLiked] = useState(post.liked_by_me);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);

    // Sync state if prop updates (e.g. from parent refresh)
    useEffect(() => {
        setIsLiked(post.liked_by_me);
        setLikesCount(post.likes_count);
    }, [post.liked_by_me, post.likes_count]);

    const handleLike = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!currentUser) return alert("Please login to like posts");

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount((prev: number) => newLikedState ? prev + 1 : prev - 1); // Fixed 'any' implicit by casting prev
        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 300);

        try {
            await postService.toggleLike(currentUser.id, post.id, !newLikedState);
            if (onLikeToggle) onLikeToggle(post.id, newLikedState);
        } catch (error) {
            console.error(error);
            setIsLiked(!newLikedState);
            setLikesCount((prev: number) => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this post?')) {
            if (onDelete) onDelete(post.id);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            scrollSnapAlign: 'start',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            overflow: 'hidden'
        }}>
            {/* Image Background (Blurred) for fill effect */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${post.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(0.5)',
                opacity: 0.5
            }} />

            {/* Main Image */}
            <img
                src={post.image_url}
                alt="Post"
                onDoubleClick={handleLike}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Keep aspect ratio
                    zIndex: 1,
                    cursor: 'pointer'
                }}
            />

            {/* Heart Animation Overlay */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                zIndex: 10,
                transform: `translate(-50%, -50%) scale(${isLikeAnimating ? 1 : 0})`,
                opacity: isLikeAnimating ? 1 : 0,
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                pointerEvents: 'none'
            }}>
                <Heart size={120} weight="fill" color="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
            </div>

            {/* Dark Gradient Overlay for Text Readability */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                zIndex: 2,
                pointerEvents: 'none'
            }} />

            {/* Content Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: '24px 20px',
                zIndex: 5,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>

                {/* User Info & Caption */}
                <div style={{ paddingRight: '60px' }}> {/* Space for rights-side buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url}) center/cover` : 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid white'
                        }}>
                            {!post.profiles?.avatar_url && <User size={20} color="white" />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                {post.profiles?.username || 'user'}
                            </div>
                        </div>
                        {/* Follow button could go here */}
                    </div>

                    {post.caption && (
                        <div style={{
                            fontSize: '0.95rem',
                            lineHeight: '1.4',
                            maxHeight: '100px',
                            overflowY: 'auto',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            opacity: 0.9
                        }}>
                            {post.caption}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', opacity: 0.7, fontSize: '0.8rem' }}>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Right Side Action Bar */}
            <div style={{
                position: 'absolute',
                right: '16px',
                bottom: '100px',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
            }}>
                {/* Like Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                        onClick={handleLike}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transform: isLiked ? 'scale(1.1)' : 'scale(1)',
                            transition: 'transform 0.2s',
                            padding: 0
                        }}
                    >
                        <Heart size={36} weight="fill" color={isLiked ? '#ef4444' : 'white'} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                    </button>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', marginTop: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {likesCount}
                    </span>
                </div>

                {/* Views Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.9 }}>
                    <Eye size={32} weight="bold" color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', marginTop: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {post.views_count ? ((post.views_count + (isActive ? 1 : 0)).toLocaleString()) : (isActive ? 1 : 0)}
                    </span>
                </div>

                {/* Delete (Owner only) */}
                {currentUser?.id === post.user_id && onDelete && (
                    <button
                        onClick={handleDelete}
                        style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: '10px', border: 'none', cursor: 'pointer', color: 'white' }}
                    >
                        <Trash size={24} />
                    </button>
                )}
            </div>

        </div>
    );
};

export default PostDetailModal;
