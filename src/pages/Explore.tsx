import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Plus } from '@phosphor-icons/react';
import { postService } from '../lib/postService';
import type { Post } from '../lib/postService';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';

const Explore = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            <Navbar />

            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', color: 'var(--gray-900)' }}>Explore</h1>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                        Loading...
                    </div>
                ) : (
                    <div style={{ columnCount: 1, gap: '24px' }}> {/* Simple column for now, can perform masonry if needed */}
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onLikeToggle={() => { }} // Optimistic handled inside
                            />
                        ))}

                        {posts.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
                                <p>No posts yet. Be the first to share!</p>
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

            {isCreateModalOpen && (
                <CreatePostModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchFeed();
                    }}
                />
            )}
        </div>
    );
};

export default Explore;
