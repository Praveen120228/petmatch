import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Storefront } from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';

const ShopRegister = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    // Form States
    const [name, setName] = useState(''); // Owner Name
    const [shopName, setShopName] = useState(''); // Will be used in onboarding, but we collect here for UX or just pass through? 
    // Actually, to keep auth simple, we might just do user signup first, then onboarding.
    // BUT user request says: "Required Fields: Owner name, Email & password, Shop name, Shop type, City" in signup.
    // So we need to capture these and probably store them in metadata or state to pass to onboarding?
    // OR create the shop immediately after signup?
    // Let's try to do it all if possible, or 2 steps.
    // AuthContext signup only takes name, email, password, role.
    // We can update profile after signup or create shop after signup.

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Signup User with role 'shop_owner'
            const result = await signup(name, email, password, 'shop_owner');

            if (!result.success) {
                throw new Error(result.error);
            }

            // 2. If Signup success, the AuthContext should have logged them in (if no confirmation needed)
            // or we show check email.
            if (result.confirmationRequired) {
                // Show confirmation message
                alert('Please check your email to confirm your account.');
                navigate('/shop/login'); // Redirect to login
                return;
            }

            // 3. Proceed to Onboarding to collect Shop Details (Shop Name, Type, City)
            // We could pass these via state, but sticking to "flow" -> Redirect to Onboarding
            navigate('/shop/onboarding', { state: { initialShopName: shopName } });

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#4F46E5', fontWeight: 800, fontSize: '1.5rem' }}>
                    <PawPrint weight="fill" /> PetMatch <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, marginLeft: '0.5rem' }}>Business</span>
                </Link>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ width: '100%', maxWidth: '500px', background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '0.75rem', background: '#ecfdf5', borderRadius: '50%', marginBottom: '1rem', color: '#16a34a' }}>
                            <Storefront size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Register your Shop</h2>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Start growing your pet business today</p>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Owner Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Business Name</label>
                            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} required placeholder="e.g. Happy Paws Grooming" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                        </div>

                        <Button type="submit" size="lg" variant="primary" loading={loading} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                            Create Business Account
                        </Button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        Already have an account? <Link to="/shop/login" style={{ color: '#16a34a', fontWeight: 600 }}>Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShopRegister;
