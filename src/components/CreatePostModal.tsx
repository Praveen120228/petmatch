import { useState, useRef } from 'react';
import { X, Image as ImageIcon } from '@phosphor-icons/react';
import Button from './Button';
import Input from './Input';
import { postService } from '../lib/postService';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

import { useEscapeKey } from '../hooks/useEscapeKey';

const CreatePostModal = ({ onClose, onSuccess }: CreatePostModalProps) => {
    const { user } = useAuth();
    useEscapeKey(onClose);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [category, setCategory] = useState('Dog');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!user || !image) return;

        setLoading(true);
        try {
            await postService.createPost(user.id, image, caption, [category.toLowerCase()]);
            setLoading(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to create post");
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--gray-100)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Create Post</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '24px', flex: 1 }}>
                    {!preview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed var(--gray-300)',
                                borderRadius: '12px',
                                height: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: 'var(--gray-50)',
                                color: 'var(--gray-500)',
                                transition: 'all 0.2s',
                                marginBottom: '20px'
                            }}
                        >
                            <ImageIcon size={48} weight="thin" />
                            <p style={{ marginTop: '10px' }}>Click to upload photo</p>
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
                        </div>
                    ) : (
                        <div style={{ marginBottom: '20px', position: 'relative' }}>
                            <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '12px', maxHeight: '400px', objectFit: 'cover' }} />
                            <button
                                onClick={() => { setImage(null); setPreview(null); }}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--gray-700)' }}>Category</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['Dog', 'Cat', 'Bird', 'Other'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: `1px solid ${category === cat ? 'var(--primary-600)' : 'var(--gray-300)'}`,
                                        background: category === cat ? 'var(--primary-50)' : 'white',
                                        color: category === cat ? 'var(--primary-700)' : 'var(--gray-600)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <Input
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            fullWidth
                        />
                    </div>

                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        disabled={!image || !category || loading}
                        variant="primary"
                        loading={loading}
                    >
                        {loading ? 'Posting...' : 'Share'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
