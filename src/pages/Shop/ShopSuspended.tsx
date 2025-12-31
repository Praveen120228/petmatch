import { Storefront, Prohibit } from '@phosphor-icons/react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const ShopSuspended = () => {
    const { logout } = useAuth();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: '2rem'
        }}>
            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Prohibit size={40} weight="duotone" />
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
                    Access Suspended
                </h1>

                <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                    Your shop access has been suspended due to a violation of our policies or administrative action.
                    Please contact support to resolve this issue.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => window.location.href = 'mailto:support@specyf.in'}
                    >
                        Contact Support
                    </Button>
                    <Button variant="ghost" fullWidth onClick={logout}>
                        Sign Out
                    </Button>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                <Storefront size={20} />
                <span style={{ fontWeight: 600 }}>Specyf Partner Portal</span>
            </div>
        </div>
    );
};

export default ShopSuspended;
