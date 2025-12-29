import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Storefront, PawPrint } from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import SEO from '../../../components/SEO';

const ShopSignup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            // Explicitly pass 'shop_owner' role
            const result = await signup(formData.name, formData.email, formData.password, 'shop_owner');

            if (result.success) {
                if (result.confirmationRequired) {
                    alert('Please check your email to confirm your account.');
                    navigate('/login'); // Or specific shop login
                } else {
                    navigate('/shop/dashboard');
                }
            } else {
                setError(result.error || 'Signup failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
            <SEO title="Partner Sign Up" description="Register your pet shop or clinic on PetMatch." />

            {/* Left Side - Hero/Branding */}
            <div className="hide-on-mobile" style={{ flex: '1', background: 'var(--primary-600)', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <PawPrint size={32} weight="fill" />
                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>PetMatch Partner</span>
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem', maxWidth: '500px' }}>
                        Grow your pet business with us.
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '450px', lineHeight: 1.6 }}>
                        Manage bookings, showcase your services, and connect with thousands of pet owners in your area.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', opacity: 0.8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Storefront size={20} />
                        <span>Grooming</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Storefront size={20} />
                        <span>Veterinary</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Storefront size={20} />
                        <span>Daycare</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ width: '100%', maxWidth: '450px' }}>

                    {/* Mobile Brand Header */}
                    <div className="hide-on-desktop" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)' }}>
                            <PawPrint size={28} weight="fill" />
                            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>PetMatch Partner</span>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: 'var(--shadow-md)', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Create Partner Account</h2>
                            <p style={{ color: '#64748b' }}>Start managing your shop today</p>
                        </div>

                        {error && (
                            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@company.com"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                />
                            </div>

                            <Button type="submit" variant="primary" fullWidth loading={isLoading} size="lg">
                                Create Account
                            </Button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                            Already have an account? <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                        </div>
                        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                            Looking to adopt? <Link to="/signup" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>User Sign up</Link>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 1023px) {
                    .hide-on-mobile { display: none !important; }
                }
                @media (min-width: 1024px) {
                    .hide-on-desktop { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default ShopSignup;
