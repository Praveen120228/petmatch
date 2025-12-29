import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Storefront,
    CalendarCheck,
    Users,
    SignOut,
    List,
    X,
    House
} from '@phosphor-icons/react';
import { useState } from 'react';
import Button from './Button';

const ShopLayout = () => {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div>Loading...</div>;

    // Role Guard
    if (!isAuthenticated) return <Navigate to="/shop/login" replace />;
    if (user?.role !== 'shop_owner') return <Navigate to="/" replace />; // Kick non-owners to main site

    const navItems = [
        { path: '/shop/dashboard', icon: <House size={20} />, label: 'Dashboard' },
        { path: '/shop/schedule', icon: <CalendarCheck size={20} />, label: 'Schedule' },
        { path: '/shop/bookings', icon: <Users size={20} />, label: 'Bookings' },
        { path: '/shop/services', icon: <Storefront size={20} />, label: 'Services' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Sidebar (Desktop) */}
            <aside style={{
                width: '260px',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                display: 'none', // Override in CSS
                flexDirection: 'column',
                position: 'fixed',
                top: 0, bottom: 0, left: 0,
                zIndex: 50
            }} className="desktop-sidebar">

                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)' }}>
                        <Storefront size={32} weight="duotone" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>Specyf</span>
                        <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: 'var(--primary-700)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Partner</span>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    color: isActive(item.path) ? 'var(--primary-700)' : '#64748b',
                                    background: isActive(item.path) ? '#eff6ff' : 'transparent',
                                    fontWeight: isActive(item.path) ? 600 : 500,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                            {user?.image ? <img src={user.image} alt="Profile" style={{ width: '100%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>User</div>}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Shop Owner</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <SignOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Nav Toggle */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 40,
                display: 'none', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between'
            }} className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)' }}>
                    <Storefront size={24} weight="duotone" />
                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Partner</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none' }}><List size={24} /></button>
            </div>

            {/* Content Area */}
            <main style={{ flex: 1, marginLeft: '0', padding: '2rem', marginTop: '0' }} className="shop-content">
                <style>{`
                    @media (min-width: 1024px) {
                        .desktop-sidebar { display: flex !important; }
                        .shop-content { margin-left: 260px !important; }
                        .mobile-header { display: none !important; }
                    }
                    @media (max-width: 1023px) {
                        .shop-content { padding-top: 5rem !important; }
                        .mobile-header { display: flex !important; }
                    }
                `}</style>
                <Outlet />
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '80%', maxWidth: '300px', background: 'white', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <span style={{ fontWeight: 700 }}>Menu</span>
                            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
                        </div>
                        <nav>
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem',
                                        textDecoration: 'none',
                                        color: '#64748b',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div style={{ marginTop: '2rem' }}>
                            <Button variant="outline" fullWidth onClick={logout}>Sign Out</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopLayout;
