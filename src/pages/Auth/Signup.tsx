import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { PawPrint, GoogleLogo } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
    const navigate = useNavigate();
    const { signup, loginWithGoogle } = useAuth();


    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setIsLoading(true);
        const { success, error, confirmationRequired } = await signup(name, email, password, 'user');

        if (success) {
            if (confirmationRequired) {
                alert('Please check your email to confirm your account before logging in.');
                navigate('/login');
            } else {
                navigate('/onboarding');
            }
        } else {
            alert(error || 'Failed to sign up');
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { success, error } = await loginWithGoogle();
            if (!success) {
                alert(error || 'Google Signup failed');
            }
        } catch (err) {
            console.error('Google signup error:', err);
            alert('An unexpected error occurred');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, rgba(255,255,255,0) 70%)'
        }} className="fade-in">
            {/* Moving Paws Background - Overlaying (Z-Index 20) */}
            <div className="paw-print paw-left" style={{ left: '5%', animationDelay: '0s', fontSize: 'clamp(1.5rem, 4vw, 3rem)', zIndex: 20, pointerEvents: 'none' }}>🐾</div>
            <div className="paw-print paw-right" style={{ left: '85%', animationDelay: '5s', fontSize: 'clamp(1.2rem, 3vw, 2rem)', zIndex: 20, pointerEvents: 'none' }}>🐾</div>
            <div className="paw-print paw-left" style={{ left: '15%', animationDelay: '2s', fontSize: 'clamp(2rem, 5vw, 4rem)', zIndex: 20, pointerEvents: 'none' }}>🐾</div>
            <div className="paw-print" style={{ left: '50%', animationDelay: '8s', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', opacity: 0.05, zIndex: 20, pointerEvents: 'none' }}>🐾</div>
            <div className="paw-print paw-right" style={{ left: '90%', animationDelay: '4s', fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)', zIndex: 20, pointerEvents: 'none' }}>🐾</div>
            <div className="paw-print paw-left" style={{ left: '8%', animationDelay: '12s', fontSize: 'clamp(1.2rem, 3vw, 2rem)', zIndex: 20, pointerEvents: 'none' }}>🐾</div>

            {/* Floating Elements (Drift) - Foreground Overlay */}
            <div style={{ position: 'absolute', top: '15%', right: '15%', fontSize: 'clamp(2rem, 6vw, 4rem)', opacity: 0.4, animationDelay: '1s', zIndex: 20, pointerEvents: 'none' }} className="animate-drift-slow float-item">🦴</div>
            <div style={{ position: 'absolute', bottom: '15%', left: '25%', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', opacity: 0.4, animationDelay: '2s', zIndex: 20, pointerEvents: 'none' }} className="animate-drift-reverse float-item">🎾</div>
            <div style={{ position: 'absolute', top: '40%', left: '5%', fontSize: 'clamp(1.8rem, 5vw, 3rem)', opacity: 0.3, zIndex: 20, pointerEvents: 'none' }} className="animate-drift float-item">🐕</div>
            <div style={{ position: 'absolute', top: '60%', right: '5%', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', opacity: 0.3, animationDelay: '3s', zIndex: 20, pointerEvents: 'none' }} className="animate-drift-slow float-item">🐈</div>

            <Card style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10, backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.85)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-drift">
                        <PawPrint size={48} weight="fill" color="var(--color-secondary)" style={{ marginBottom: '1rem' }} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Join Specyf</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Create an account to get started.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        fullWidth
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <Input
                        label="Password"
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
                    <Button type="submit" fullWidth size="lg" style={{ marginTop: '0.5rem' }} variant="primary" loading={isLoading} disabled={isLoading}>
                        Create Account
                    </Button>

                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="lg"
                    onClick={handleGoogleLogin}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <GoogleLogo size={20} weight="bold" />
                    Sign up with Google
                </Button>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Log In</Link>
                </div>
            </Card>

            <style>{`
                @media (max-width: 768px) {
                    .paw-left { left: 5% !important; }
                    .paw-right { left: 88% !important; }
                    .float-item { opacity: 0.3 !important; }
                }
            `}</style>
        </div>
    );
};

export default Signup;
