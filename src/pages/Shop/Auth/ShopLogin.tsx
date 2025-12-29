import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Storefront } from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import { supabase } from '../../../lib/supabase';

const ShopLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Perform standard login
            const result = await login(email, password);
            if (!result.success) {
                throw new Error(result.error || 'Login failed');
            }

            // 2. Strict Role Check (Auth Metadata)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            if (user.user_metadata?.role !== 'shop_owner') {
                // Not a shop owner, sign them out immediately from this view
                await supabase.auth.signOut();
                throw new Error('Access denied. This portal is for shop owners only.');
            }

            // 3. Check Shop Status (Optional optimization: fetch shop status here to redirect to onboarding if needed)
            const { data: shop } = await supabase
                .from('shops')
                .select('status')
                .eq('owner_id', user.id)
                .single();

            if (!shop) {
                navigate('/shop/onboarding');
            } else if (shop.status === 'pending') {
                // Maybe show a pending screen or allow dashboard with limited access?
                // For now, let them to dashboard but dashboard might show pending state
                navigate('/shop/dashboard');
            } else {
                navigate('/shop/dashboard');
            }

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--primary-600)', fontWeight: 800, fontSize: '1.5rem' }}>
                    <PawPrint weight="fill" /> Specyf <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 500, marginLeft: '0.5rem' }}>Business</span>
                </Link>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-50)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--primary-600)' }}>
                            <Storefront size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Shop Owner Login</h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Manage your bookings and services</p>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        <Button type="submit" size="lg" variant="primary" loading={loading} fullWidth>
                            Sign In
                        </Button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        Don't have a shop account? <Link to="/shop/register" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShopLogin;
