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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'shop_owner') {
                    // Block access
                    await supabase.auth.signOut();
                    alert('Access Denied: This login is for Pet Owners only. Please use the Shop Owner Login.');
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
            minHeight: '80vh',
            padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <PawPrint size={48} weight="fill" color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
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
