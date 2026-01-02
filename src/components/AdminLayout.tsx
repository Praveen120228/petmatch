import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ChartBar,
    Storefront,
    SignOut,
    List,
    X,
    ShieldCheck,
    Users,
    CalendarCheck,
    PawPrint,
    ChartLineUp,
    Flag,
    MagnifyingGlass,
    Bell,
    Check,
    House
} from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Button from './Button';

const AdminLayout = () => {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Fetch and Subscribe to Notifications
    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Realtime Subscription
        const channel = supabase
            .channel('admin-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
                (payload) => {
                    const newNotification = payload.new;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    // Optional: Play sound or toast
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
    };

    if (loading) return <div>Loading...</div>;

    // Role Guard
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/" replace />;

    const navItems = [
        { path: '/admin/dashboard', icon: <ChartBar size={20} />, label: 'Dashboard' },
        { path: '/admin/shops', icon: <Storefront size={20} />, label: 'Manage Shops' },
        { path: '/admin/users', icon: <Users size={20} />, label: 'Users' },
        { path: '/admin/bookings', icon: <CalendarCheck size={20} />, label: 'Bookings' },
        { path: '/admin/pets', icon: <PawPrint size={20} />, label: 'Pets' },
        { path: '/admin/reports', icon: <Flag size={20} />, label: 'Reports' },
        { path: '/admin/analytics', icon: <ChartLineUp size={20} />, label: 'Analytics' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
            {/* Sidebar (Desktop) */}
            <aside style={{
                width: '260px',
                background: '#0f172a',
                borderRight: '1px solid #1e293b',
                color: 'white',
                display: 'none', // Override in CSS
                flexDirection: 'column',
                position: 'fixed',
                top: 0, bottom: 0, left: 0,
                zIndex: 50
            }} className="desktop-sidebar">

                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #1e293b' }}>
                    <ShieldCheck size={32} weight="duotone" color="#2dd4bf" />
                    <div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block', lineHeight: 1, letterSpacing: '-0.025em' }}>Specyf</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Partnership</span>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
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
                                    color: isActive(item.path) ? '#2dd4bf' : '#94a3b8',
                                    background: isActive(item.path) ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
                                    fontWeight: isActive(item.path) ? 600 : 500,
                                    border: isActive(item.path) ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link
                        to="/"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#94a3b8',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <House size={20} /> Back to Home
                    </Link>

                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        <SignOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Nav Toggle & Header */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: '#0f172a', borderBottom: '1px solid #1e293b', color: 'white', zIndex: 40,
                display: 'none', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between'
            }} className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={24} weight="duotone" color="#2dd4bf" />
                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white' }}><List size={24} /></button>
            </div>

            {/* Main Wrapper */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: '0' }} className="admin-wrapper">

                {/* Top Header (Desktop) */}
                <header className="desktop-header" style={{
                    height: '72px',
                    background: '#0f172a',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30
                }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '320px' }}>
                        <MagnifyingGlass
                            size={18}
                            color="#64748b"
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search Dashboard..."
                            style={{
                                width: '100%',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2dd4bf'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                    </div>

                    {/* Right Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }} ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    background: showNotifications ? '#334155' : '#1e293b',
                                    border: 'none',
                                    borderRadius: '8px',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: showNotifications ? 'white' : '#94a3b8',
                                    position: 'relative',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Bell size={20} weight={unreadCount > 0 ? "fill" : "regular"} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        minWidth: '16px',
                                        height: '16px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #0f172a'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: '120%',
                                    right: 0,
                                    width: '320px',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                                    zIndex: 100,
                                    overflow: 'hidden',
                                    animation: 'fadeIn 0.2s ease-out'
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Notifications</h4>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                style={{ background: 'none', border: 'none', color: '#2dd4bf', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    style={{
                                                        padding: '1rem',
                                                        borderBottom: '1px solid #334155',
                                                        background: notif.is_read ? 'transparent' : 'rgba(45, 212, 191, 0.05)',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                                        <div style={{ marginTop: '2px' }}>
                                                            {notif.type === 'report' ? <Flag color="#ef4444" weight="fill" /> : <Check color="#2dd4bf" weight="bold" />}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: notif.is_read ? '#94a3b8' : '#f8fafc', lineHeight: 1.4 }}>
                                                                {notif.message}
                                                            </p>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {!notif.is_read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notif.id)}
                                                                        style={{ background: 'none', border: 'none', color: '#2dd4bf', fontSize: '0.7rem', cursor: 'pointer' }}
                                                                    >
                                                                        Mark read
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {notif.link && (
                                                                <Link
                                                                    to={notif.link}
                                                                    onClick={() => setShowNotifications(false)}
                                                                    style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}
                                                                >
                                                                    View Details →
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', overflow: 'hidden', border: '2px solid #1e293b' }}>
                                {user?.image ? <img src={user.image} alt="Profile" style={{ width: '100%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>A</div>}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{user?.name || 'Admin User'}</p>
                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main style={{ flex: 1, padding: '2rem' }} className="admin-content">
                    <Outlet />
                </main>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .desktop-sidebar { display: flex !important; }
                    .admin-wrapper { margin-left: 260px !important; }
                    .mobile-header { display: none !important; }
                    .desktop-header { display: flex !important; }
                }
                @media (max-width: 1023px) {
                    .admin-content { padding-top: 5rem !important; }
                    .mobile-header { display: flex !important; }
                    .desktop-header { display: none !important; }
                    .admin-wrapper { margin-left: 0 !important; }
                }
                
                /* Dark Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #0f172a; 
                }
                ::-webkit-scrollbar-thumb {
                    background: #334155; 
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #475569; 
                }
            `}</style>

            {/* Mobile Sidebar Overlay */}
            {
                sidebarOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '85%', maxWidth: '300px', background: '#0f172a', padding: '1.5rem', color: 'white', borderRight: '1px solid #1e293b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ShieldCheck size={28} weight="duotone" color="#2dd4bf" />
                                    <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Specyf</span>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b' }}><X size={24} /></button>
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
                                            color: isActive(item.path) ? '#2dd4bf' : '#94a3b8',
                                            background: isActive(item.path) ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
                                            borderRadius: '8px',
                                            fontWeight: isActive(item.path) ? 600 : 400,
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <Link
                                    to="/"
                                    onClick={() => setSidebarOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #334155',
                                        color: '#94a3b8',
                                        textDecoration: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <House size={18} /> Back to Home
                                </Link>
                                <Button variant="outline" fullWidth onClick={logout} style={{ borderColor: '#334155', color: '#94a3b8' }}>Sign Out</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminLayout;
