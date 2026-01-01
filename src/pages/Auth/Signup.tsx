import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { PawPrint } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { celebrateAccountCreation } from '../../utils/delight';

const Signup = () => {
    const navigate = useNavigate();
    const { signup, isAuthenticated, loading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const isSigningUp = useRef(false);

    // Redirect if already logged in (but not if just signed up)
    useEffect(() => {
        if (!loading && isAuthenticated && !isSigningUp.current) {
            navigate('/match');
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        isSigningUp.current = true;
        const { success, error, confirmationRequired } = await signup(name, email, password, 'user');

        if (success) {
            celebrateAccountCreation(); // Trigger delight!
            if (confirmationRequired) {
                alert('Please check your email to confirm your account before logging in.');
                navigate('/login');
            } else {
                // Short delay to let them see the explosion? No, let it explode on the new page or during transition?
                // Actually, if we navigate immediately it might cut off. 
                // But typically confetti canvas is on body or fixed. 
                // Let's navigate immediately for snappy feel, confetti often persists if configured right or just explodes.
                navigate('/onboarding');
            }
        } else {
            alert(error || 'Signup failed');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
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
                    <Button type="submit" fullWidth size="lg" style={{ marginTop: '0.5rem' }} variant="primary">
                        Create Account
                    </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Log In</Link>
                </div>
            </Card>

            <style>{`
                @media (max-width: 768px) {
                    /* On mobile, push elements to the edges */
                    .paw-left { left: 5% !important; }
                    .paw-right { left: 88% !important; }
                    /* Hide center elements if they interfere, or keep them subtle */
                    .float-item { opacity: 0.5 !important; }
                }
            `}</style>
        </div>
    );
};

export default Signup;
