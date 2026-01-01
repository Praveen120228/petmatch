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
            {/* Moving Paws Background */}
            <div className="paw-print" style={{ left: '10%', animationDelay: '0s', fontSize: '3rem' }}>🐾</div>
            <div className="paw-print" style={{ left: '30%', animationDelay: '5s', fontSize: '2rem' }}>🐾</div>
            <div className="paw-print" style={{ left: '70%', animationDelay: '2s', fontSize: '4rem' }}>🐾</div>
            <div className="paw-print" style={{ left: '50%', animationDelay: '8s', fontSize: '2.5rem' }}>🐾</div>
            <div className="paw-print" style={{ left: '90%', animationDelay: '4s', fontSize: '3.5rem' }}>🐾</div>
            <div className="paw-print" style={{ left: '20%', animationDelay: '12s', fontSize: '2rem' }}>🐾</div>

            {/* Floating Elements (Drift) */}
            <div style={{ position: 'absolute', top: '15%', right: '15%', fontSize: '4rem', opacity: 0.1, animationDelay: '1s' }} className="animate-drift-slow">🦴</div>
            <div style={{ position: 'absolute', bottom: '15%', left: '25%', fontSize: '2.5rem', opacity: 0.15, animationDelay: '2s' }} className="animate-drift-reverse">🎾</div>
            <div style={{ position: 'absolute', top: '40%', left: '5%', fontSize: '3rem', opacity: 0.1 }} className="animate-drift">🐕</div>
            <div style={{ position: 'absolute', top: '60%', right: '5%', fontSize: '2.5rem', opacity: 0.1, animationDelay: '3s' }} className="animate-drift-slow">🐈</div>

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
                    <Button type="submit" fullWidth size="lg" style={{ marginTop: '0.5rem' }}>
                        Log In
                    </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Sign Up</Link>
                </div>
            </Card>
        </div>
    );
};

export default Login;
