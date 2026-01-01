import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { PawPrint, User, Chats, List, X, Storefront, ShieldCheck, Globe } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '72px'
    };

    const logoStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 800,
        color: 'var(--primary-600)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none',
    };

    // Desktop Links
    const linkContainerStyle: React.CSSProperties = {
        display: 'none', // Hidden by default, shown via media query logic in inline styles usually requires window listener or CSS class
        // We will use a standard responsive approach with JS for simplicity in this file-based edit without complex CSS modules
        gap: '1.5rem',
        alignItems: 'center',
    };

    const isActive = (path: string) => location.pathname === path;

    const linkStyle = (path: string): React.CSSProperties => {
        const active = isActive(path);
        return {
            color: active ? 'var(--primary-700)' : 'var(--gray-500)',
            background: active ? 'var(--primary-50)' : 'transparent',
            fontWeight: active ? 600 : 500,
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
        };
    };

    // Mobile Menu Overlay
    const mobileMenuOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: '72px',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'white',
        padding: '2rem',
        display: mobileMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 99,
        animation: 'fadeIn 0.2s ease-out'
    };

    return (
        <>
            <style>
                {`
                    @media (min-width: 769px) {
                        .desktop-nav { display: flex !important; }
                        .mobile-toggle { display: none !important; }
                    }
                    @media (max-width: 768px) {
                        .desktop-nav { display: none !important; }
                        .mobile-toggle { display: block !important; }
                    }
                `}
            </style>
            <nav style={navStyle}>
                {isAuthenticated ? (
                    <Link to="/match" style={logoStyle} onClick={() => setMobileMenuOpen(false)}>
                        <PawPrint weight="fill" color="currentColor" /> Specyf
                    </Link>
                ) : (
                    <Link
                        to="/"
                        style={{ ...logoStyle, textDecoration: 'none', cursor: 'pointer' }}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <PawPrint weight="fill" color="currentColor" /> Specyf
                    </Link>
                )}

                {/* Desktop Nav */}
                <div className="desktop-nav" style={linkContainerStyle}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/match" style={linkStyle('/match')}>
                                Find Pets
                            </Link>
                            <Link to="/explore" style={linkStyle('/explore')}>
                                <Globe size={20} /> Community
                            </Link>
                            <Link to="/shops" style={linkStyle('/shops')}>
                                <Storefront size={20} /> Shops
                            </Link>
                            <Link to="/messages" style={linkStyle('/messages')}>
                                <Chats size={20} /> Messages
                            </Link>
                            <Link to="/profile" style={{ ...linkStyle('/profile'), borderRadius: '50%', padding: 0, width: '40px', height: '40px', overflow: 'hidden', border: isActive('/profile') ? '2px solid var(--primary-600)' : '2px solid transparent' }}>
                                {user?.image ? (
                                    <img src={user.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={24} color="var(--gray-600)" />
                                    </div>
                                )}
                            </Link>
                            {user?.role === 'admin' && (
                                <Link to="/admin" style={{ ...linkStyle('/admin'), background: '#1e293b', color: 'white' }}>
                                    <ShieldCheck size={20} /> Admin
                                </Link>
                            )}
                        </>
                    ) : (
                        <>

                            <Link to="/for-pet-businesses" style={{ ...linkStyle('/for-pet-businesses'), marginRight: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                                For Business
                            </Link>
                            <Link to="/login">
                                <Button size="sm" variant="ghost">Login</Button>
                            </Link>
                            <Link to="/signup">
                                <Button size="sm" variant="primary">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--gray-800)' }}
                >
                    {mobileMenuOpen ? <X size={28} /> : <List size={28} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div style={mobileMenuOverlayStyle}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/match" style={linkStyle('/match')} onClick={() => setMobileMenuOpen(false)}>
                                <PawPrint size={24} /> <span style={{ fontSize: '1.25rem' }}>Find Pets</span>
                            </Link>
                            <Link to="/explore" style={linkStyle('/explore')} onClick={() => setMobileMenuOpen(false)}>
                                <Globe size={24} /> <span style={{ fontSize: '1.25rem' }}>Community</span>
                            </Link>
                            <Link to="/shops" style={linkStyle('/shops')} onClick={() => setMobileMenuOpen(false)}>
                                <Storefront size={24} /> <span style={{ fontSize: '1.25rem' }}>Shops</span>
                            </Link>
                            <Link to="/messages" style={linkStyle('/messages')} onClick={() => setMobileMenuOpen(false)}>
                                <Chats size={24} /> <span style={{ fontSize: '1.25rem' }}>Messages</span>
                            </Link>
                            <Link to="/profile" style={linkStyle('/profile')} onClick={() => setMobileMenuOpen(false)}>
                                <User size={24} /> <span style={{ fontSize: '1.25rem' }}>Profile</span>
                            </Link>
                        </>
                    ) : (
                        <>

                            <Link to="/for-pet-businesses" style={linkStyle('/for-pet-businesses')} onClick={() => setMobileMenuOpen(false)}>
                                <span style={{ fontSize: '1.25rem' }}>For Business</span>
                            </Link>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ width: '100%' }}>
                                <Button size="lg" variant="outline" fullWidth>Login</Button>
                            </Link>
                            <Link to="/signup" onClick={() => setMobileMenuOpen(false)} style={{ width: '100%' }}>
                                <Button size="lg" variant="primary" fullWidth>Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default Navbar;
