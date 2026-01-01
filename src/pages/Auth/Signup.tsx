import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { PawPrint } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

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
            if (confirmationRequired) {
                alert('Please check your email to confirm your account before logging in.');
                navigate('/login');
            } else {
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
            {/* Background Decoration (Floating Elements) */}
            <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '3rem', opacity: 0.2, animationDelay: '0s' }} className="float-animation">🐾</div>
            <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '4rem', opacity: 0.15, animationDelay: '1s' }} className="float-animation">🦴</div>
            <div style={{ position: 'absolute', bottom: '15%', left: '20%', fontSize: '2.5rem', opacity: 0.2, animationDelay: '2s' }} className="float-animation">🎾</div>
            <div style={{ position: 'absolute', bottom: '20%', right: '10%', fontSize: '3rem', opacity: 0.1, animationDelay: '3s' }} className="float-animation">🐕</div>
            <div style={{ position: 'absolute', top: '15%', left: '80%', fontSize: '2rem', opacity: 0.2, animationDelay: '1.5s' }} className="float-animation">🐈</div>

            <Card style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10, backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.8)' }}>
                <div style={{ textAlign: 'center' }}>
                    <PawPrint size={48} weight="fill" color="var(--color-secondary)" style={{ marginBottom: '1rem' }} />
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
        </div>
    );
};

export default Signup;
