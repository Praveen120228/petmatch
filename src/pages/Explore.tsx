import { useState, useEffect } from 'react';
import { Plus, Heart, MagnifyingGlass } from '@phosphor-icons/react';
import { postService } from '../lib/postService';
import type { Post } from '../lib/postService';

import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import { useAuth } from '../context/AuthContext';

const Explore = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPosts = posts.filter(post =>
        (post.caption?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (post.profiles?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchFeed();
    }, [user]);

    const fetchFeed = async () => {
        try {
            const data = await postService.getFeed(user?.id);
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--gray-50)', paddingBottom: '80px' }}>

            <div style={{ maxWidth: '100%', paddingBottom: '20px' }}>
                {/* Header & Search */}
                <div style={{ padding: '16px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--gray-900)' }}>Explore</h1>

                    {/* Search Bar */}
                    <div style={{
                        position: 'relative',
                        maxWidth: '100%',
                        marginBottom: '8px'
                    }}>
                        <MagnifyingGlass
                            size={20}
                            weight="bold"
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--gray-500)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search people or captions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '12px',
                                border: '1px solid var(--gray-200)',
                                background: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                        Loading...
                    </div>
                ) : (
                    <div className="explore-grid" style={{
                        // display: 'grid' handled by class
                        // gridTemplateColumns handled by class
                        gap: '2px',
                        padding: '0 2px',
                        maxWidth: '1280px',
                        margin: '0 auto'
                    }}>
                        {filteredPosts.map(post => (
                            <div
                                key={post.id}
                                style={{
                                    position: 'relative',
                                    aspectRatio: '9/16', // Vertical Reels style
                                    background: 'var(--gray-200)',
                                    cursor: 'pointer',
                                    overflow: 'hidden'
                                }}
                                className="explore-item"
                                onClick={() => setSelectedPost(post)}
                            >
                                <img
                                    src={post.image_url}
                                    alt={post.caption || 'Post'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    loading="lazy"
                                />

                                {/* Type Indicator (Mock for now, assuming all images) - Top Right */}
                                <div style={{ position: 'absolute', top: '8px', right: '8px', color: 'white' }}>
                                    {/* Could be VideoCamera vs Images, putting icon for 'Reel' look if needed */}
                                    {/* <VideoCamera size={20} weight="fill" /> */}
                                </div>

                                {/* Hover Overlay */}
                                <div className="overlay" style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    padding: '12px',
                                    opacity: 0,
                                    transition: 'opacity 0.2s'
                                }}>
                                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                                        {/* Minimal info */}
                                        {post.likes_count > 0 && (
                                            <>
                                                <Heart weight="fill" /> {post.likes_count}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Styles */}
                                <style>
                                    {`
                                        .explore-grid {
                                            display: grid;
                                            grid-template-columns: repeat(3, 1fr);
                                        }
                                        @media (min-width: 768px) {
                                            .explore-grid { grid-template-columns: repeat(4, 1fr); }
                                        }
                                        @media (min-width: 1024px) {
                                            .explore-grid { grid-template-columns: repeat(5, 1fr); }
                                        }
                                        @media (min-width: 1400px) {
                                            .explore-grid { grid-template-columns: repeat(6, 1fr); }
                                        }

                                        .explore-item:hover .overlay {
                                            opacity: 1 !important;
                                        }
                                    `}
                                </style>
                            </div>
                        ))}

                        {filteredPosts.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
                                {posts.length === 0 ? <p>No posts yet. Be the first to share!</p> : <p>No matches found.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                    color: 'white',
                    border: 'none',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 90
                }}
            >
                <Plus size={24} weight="bold" />
            </button>

            {
                isCreateModalOpen && (
                    <CreatePostModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => {
                            setIsCreateModalOpen(false);
                            fetchFeed();
                        }}
                    />
                )
            }

            {
                selectedPost && (
                    <PostDetailModal
                        posts={filteredPosts}
                        initialIndex={filteredPosts.findIndex(p => p.id === selectedPost.id)}
                        isOpen={!!selectedPost}
                        onClose={() => setSelectedPost(null)}
                        onLikeToggle={(postId, newStatus) => {
                            setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: newStatus, likes_count: p.likes_count + (newStatus ? 1 : -1) } : p));
                        }}
                    />
                )
            }
        </div >
    );
};

export default Explore;
