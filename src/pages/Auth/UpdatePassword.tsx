import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { LockKey } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure user is authenticated (magic link should have handled this)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, the link might be invalid or expired
                // setError("Invalid or expired reset link. Please try again.");
                // navigate('/forgot-password');
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { success, error } = await updatePassword(password);
            if (success) {
                alert("Password updated successfully! Logging you in...");
                navigate('/match');
            } else {
                setError(error || "Failed to update password.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '1rem',
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, rgba(255,255,255,0) 70%)'
        }}>
            <Card style={{ width: '100%', maxWidth: '400px', padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'inline-block', padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '50%', marginBottom: '1rem' }}>
                        <LockKey size={32} weight="fill" color="var(--primary-600)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Set New Password</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Please enter your new password below.</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                    />
                    <Button type="submit" fullWidth size="lg" disabled={loading} loading={loading}>
                        Update Password
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default UpdatePassword;
