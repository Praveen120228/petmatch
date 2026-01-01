import { useState } from 'react';
import { Heart, User } from '@phosphor-icons/react';
import type { Post } from '../lib/postService';
import { useAuth } from '../context/AuthContext';
import { postService } from '../lib/postService';

interface PostCardProps {
    post: Post;
    onLikeToggle: () => void;
}

const PostCard = ({ post, onLikeToggle }: PostCardProps) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.liked_by_me);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);

    const handleLike = async () => {
        if (!user) return alert("Please login to like posts");

        // Optimistic update
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 300);

        try {
            await postService.toggleLike(user.id, post.id, !newLikedState); // Pass *previous* state to toggle
            onLikeToggle(); // Optional: refresh parent or just trust local
        } catch (error) {
            console.error(error);
            // Revert on error
            setIsLiked(!newLikedState);
            setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-100)',
            marginBottom: '24px',
            breakInside: 'avoid' // For masonry
        }} className="post-card fade-in">
            {/* Header */}
            <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url}) center/cover` : 'var(--gray-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {!post.profiles?.avatar_url && <User size={16} color="gray" />}
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                        {post.profiles?.name || 'Unknown User'}
                    </div>
                    {post.profiles?.username && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            @{post.profiles.username}
                        </div>
                    )}
                </div>
            </div>

            {/* Image */}
            <div
                onDoubleClick={handleLike}
                style={{
                    width: '100%',
                    position: 'relative',
                    cursor: 'pointer'
                }}>
                <img
                    src={post.image_url}
                    alt="Post"
                    style={{ width: '100%', display: 'block', height: 'auto' }}
                    loading="lazy"
                />

                {/* Heart Animation Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${isLikeAnimating ? 1 : 0})`,
                    opacity: isLikeAnimating ? 1 : 0,
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    <Heart size={80} weight="fill" color="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                </div>
            </div>

            {/* Actions & Content */}
            <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <button
                        onClick={handleLike}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: isLiked ? '#ef4444' : 'var(--gray-600)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'transform 0.1s'
                        }}
                        className={isLikeAnimating ? 'scale-up' : ''}
                    >
                        <Heart size={24} weight={isLiked ? "fill" : "regular"} />
                    </button>
                    {/* Add Comment/Share later */}
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px', color: 'var(--gray-900)' }}>
                    {likesCount} likes
                </div>

                {post.caption && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-800)', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 600, marginRight: '6px' }}>{post.profiles?.username}</span>
                        {post.caption}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
