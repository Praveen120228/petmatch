import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { PawPrint } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Redirect if already logged in
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/match');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Attempt Login
            const { success, error } = await login(email, password);
            if (!success) {
                alert(error || 'Login failed');
                return;
            }

            // 2. Strict User Role Check
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check metadata directly (Auth Table separation)
                if (user.user_metadata?.role === 'shop_owner') {
                    // Block access
                    await supabase.auth.signOut();
                    alert('Access Denied: This login is for Pet Owners only. Please use the Shop Owner Login.');
                    return;
                }

                // Admin Redirect
                if (user.user_metadata?.role === 'admin') {
                    navigate('/admin/dashboard');
                    return;
                }
            }

            // 3. Success
            navigate('/match');

        } catch (err) {
            console.error('Login error:', err);
            alert('An unexpected error occurred');
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
            <div style={{ position: 'absolute', top: '10%', right: '10%', fontSize: 'clamp(2rem, 6vw, 4rem)', opacity: 0.4, animationDelay: '1s', zIndex: 20, pointerEvents: 'none' }} className="animate-drift-slow float-item">🦴</div>
            <div style={{ position: 'absolute', bottom: '10%', left: '10%', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', opacity: 0.4, animationDelay: '2s', zIndex: 20, pointerEvents: 'none' }} className="animate-drift-reverse float-item">🎾</div>
            <div style={{ position: 'absolute', top: '25%', left: '5%', fontSize: 'clamp(1.8rem, 5vw, 3rem)', opacity: 0.3, zIndex: 20, pointerEvents: 'none' }} className="animate-drift float-item">🐕</div>
            <div style={{ position: 'absolute', bottom: '25%', right: '5%', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', opacity: 0.3, animationDelay: '3s', zIndex: 20, pointerEvents: 'none' }} className="animate-drift-slow float-item">🐈</div>

            <Card style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 10, backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.85)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-drift">
                        <PawPrint size={48} weight="fill" color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Log in to find your pet's perfect match.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        style={{ fontSize: '16px' }} // Prevent iOS zoom
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        style={{ fontSize: '16px' }}
                    />
                    <Button type="submit" fullWidth size="lg" style={{ marginTop: '0.5rem' }}>
                        Log In
                    </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Sign Up</Link>
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

export default Login;
