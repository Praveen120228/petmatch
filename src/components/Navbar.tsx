import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { PawPrint, User, Chats } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const navStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: 'var(--glass-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
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

    const linkContainerStyle: React.CSSProperties = {
        display: 'flex',
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
            textDecoration: 'none', // Ensure no underline
        };
    };

    return (
        <nav style={navStyle}>
            {isAuthenticated ? (
                <Link to="/match" style={logoStyle}>
                    <PawPrint weight="fill" color="currentColor" /> PetMatch
                </Link>
            ) : (
                <Link
                    to="/"
                    style={{ ...logoStyle, textDecoration: 'none', cursor: 'pointer' }}
                >
                    <PawPrint weight="fill" color="currentColor" /> PetMatch
                </Link>
            )}

            <div style={linkContainerStyle}>
                {isAuthenticated ? (
                    <>
                        <Link to="/match" style={linkStyle('/match')}>
                            Find Pets
                        </Link>
                        <Link to="/messages" style={linkStyle('/messages')}>
                            <Chats size={20} /> Messages
                        </Link>
                        <Link to="/profile" style={linkStyle('/profile')}>
                            <User size={20} /> Profile
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            <Button size="sm" variant="ghost">Login</Button>
                        </Link>
                        <Link to="/signup">
                            <Button size="sm" variant="primary">Sign Up</Button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
