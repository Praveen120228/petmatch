import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ChartBar,
    Storefront,
    SignOut,
    List,
    X,
    ShieldCheck
} from '@phosphor-icons/react';
import { useState } from 'react';
import Button from './Button';

const AdminLayout = () => {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div>Loading...</div>;

    // Role Guard
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/" replace />;

    const navItems = [
        { path: '/admin/dashboard', icon: <ChartBar size={20} />, label: 'Dashboard' },
        { path: '/admin/shops', icon: <Storefront size={20} />, label: 'Manage Shops' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Sidebar (Desktop) */}
            <aside style={{
                width: '260px',
                background: '#1e293b',
                color: 'white',
                display: 'none', // Override in CSS
                flexDirection: 'column',
                position: 'fixed',
                top: 0, bottom: 0, left: 0,
                zIndex: 50
            }} className="desktop-sidebar">

                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
                        <div style={{ background: 'var(--primary-600)', padding: '0.5rem', borderRadius: '8px' }}>
                            <ShieldCheck size={24} weight="fill" />
                        </div>
                        <div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block', lineHeight: 1 }}>Specyf</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Admin Portal</span>
                        </div>
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
                                    color: isActive(item.path) ? 'white' : '#94a3b8',
                                    background: isActive(item.path) ? 'var(--primary-600)' : 'transparent',
                                    fontWeight: isActive(item.path) ? 600 : 500,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', overflow: 'hidden' }}>
                            {user?.image ? <img src={user.image} alt="Profile" style={{ width: '100%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Administrator</p>
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
                position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: '#1e293b', color: 'white', zIndex: 40,
                display: 'none', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between'
            }} className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={24} weight="duotone" />
                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white' }}><List size={24} /></button>
            </div>

            {/* Content Area */}
            <main style={{ flex: 1, marginLeft: '0', padding: '2rem', marginTop: '0' }} className="admin-content">
                <style>{`
                    @media (min-width: 1024px) {
                        .desktop-sidebar { display: flex !important; }
                        .admin-content { margin-left: 260px !important; }
                        .mobile-header { display: none !important; }
                    }
                    @media (max-width: 1023px) {
                        .admin-content { padding-top: 5rem !important; }
                        .mobile-header { display: flex !important; }
                    }
                `}</style>
                <Outlet />
            </main>

            {/* Mobile Sidebar Overlay */}
            {
                sidebarOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '80%', maxWidth: '300px', background: '#1e293b', padding: '1.5rem', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <span style={{ fontWeight: 700 }}>Menu</span>
                                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={24} /></button>
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
                                            color: '#94a3b8',
                                            borderBottom: '1px solid #334155'
                                        }}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div style={{ marginTop: '2rem' }}>
                                <Button variant="outline" fullWidth onClick={logout} style={{ borderColor: '#334155', color: 'white' }}>Sign Out</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminLayout;
