import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { PawPrint } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
    const { resetPasswordForEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { success, error } = await resetPasswordForEmail(email);
            if (success) {
                setMessage("Check your email for the password reset link.");
            } else {
                setError(error || "Failed to send reset email.");
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
                        <PawPrint size={32} weight="fill" color="var(--primary-600)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Forgot Password?</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {message && (
                    <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <Button type="submit" fullWidth size="lg" disabled={loading} loading={loading}>
                        Send Reset Link
                    </Button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Remember your password? <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Log In</Link>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPassword;
