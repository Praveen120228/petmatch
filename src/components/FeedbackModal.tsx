import { useState } from 'react';
import { X, Star, PaperPlaneRight } from '@phosphor-icons/react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
    const { user } = useAuth();
    const [rating, setRating] = useState<number>(0);
    const [category, setCategory] = useState<string>('general');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!rating) return alert("Please select a rating");
        if (!description.trim()) return alert("Please provide some feedback");

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback').insert({
                user_id: user?.id,
                rating,
                category,
                description,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            alert("Thank you for your feedback!");
            onClose();
            // Reset form
            setRating(0);
            setDescription('');
            setCategory('general');
        } catch (err: any) {
            console.error("Feedback error", err);
            // Fallback for demo if table doesn't exist
            if (err.message?.includes('relation "public.feedback" does not exist')) {
                alert("Feedback sent! (Simulated - Database table 'feedback' missing)");
                onClose();
            } else {
                alert("Failed to submit feedback. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="fade-in-up" style={{
                width: '90%', maxWidth: '500px',
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Feedback</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Help us improve your experience</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9', border: 'none',
                            width: '36px', height: '36px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                        }}
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                        How would you rate your experience?
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0.25rem', transform: rating >= star ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s'
                                }}
                            >
                                <Star
                                    size={32}
                                    weight={rating >= star ? "fill" : "regular"}
                                    color={rating >= star ? "#fbbf24" : "#cbd5e1"}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Topic</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['General', 'Bug Report', 'Feature Request', 'Other'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat.toLowerCase())}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '999px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    border: category === cat.toLowerCase() ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                                    background: category === cat.toLowerCase() ? 'var(--primary-50)' : 'white',
                                    color: category === cat.toLowerCase() ? 'var(--primary-700)' : '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Tell us more</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What do you like? What can we do better?"
                        rows={4}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '12px',
                            border: '1px solid #cbd5e1', resize: 'vertical',
                            fontSize: '0.95rem', fontFamily: 'inherit',
                            outlineColor: 'var(--primary-500)'
                        }}
                    />
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" onClick={onClose} fullWidth>Maybe Later</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !rating || !description.trim()}
                        loading={isSubmitting}
                        fullWidth
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <PaperPlaneRight size={18} weight="bold" /> Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
