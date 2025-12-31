import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { userService } from '../lib/userService';

interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    username?: string;
    role?: 'user' | 'shop_owner' | 'admin';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string, role?: 'user' | 'shop_owner' | 'admin') => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
    updateUser: (data: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        // Hydrate from localStorage immediately
        try {
            const cached = localStorage.getItem('specyf_user');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email || '');
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email || '');
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Safety Timeout: Force loading to false after 8 seconds if DB hangs
        const timeoutId = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.error('Auth loading timed out. Database might be slow or locked.');
                    return false;
                }
                return prev;
            });
        }, 8000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            // 1. Attempt to fetch
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // 2. If missing, attempt to create
            if (error) {
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: email,
                        name: (await supabase.auth.getUser()).data.user?.user_metadata?.name || email.split('@')[0],
                        avatar_url: '',
                        role: 'user'
                    })
                    .select()
                    .single();

                if (!createError) {
                    data = newProfile;
                }
            }

            // 3. Update State
            if (data) {
                // SECURITY CHECK: Kick out banned/suspended users
                if (data.status === 'suspended' || data.status === 'banned') {
                    console.warn(`User ${data.email} is ${data.status}. Logging out.`);
                    await logout();
                    alert(`Your account has been ${data.status}. Please contact support.`);
                    return; // Stop here
                }

                setUser({
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    image: data.avatar_url,
                    role: data.role as 'user' | 'shop_owner' | 'admin'
                });

                // Update Cache
                localStorage.setItem('specyf_user', JSON.stringify({
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    image: data.avatar_url,
                    role: data.role
                }));

                if (data.id) {
                    userService.captureIpAddress(data.id);
                }
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };


    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const signup = async (name: string, email: string, password: string, role: 'user' | 'shop_owner' | 'admin' = 'user') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role } // Pass role to metadata, triggers can use this or we use it on profile creation
            }
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
            // Need to ensure profile handles role.
            // If we have a trigger that creates profile from metadata, great.
            // If not, our fetchProfile logic handles creation but needs to know role.
            // Since fetchProfile is 'lazy', we might want to force create profile here if we want role set immediately.

            // HACK: For now, we will count on metadata being available or setting it during profile auto-creation if we change that logic.
            // Actually, let's explicitely write to profiles if we can, but we are likely RLS restricted until confirming email?
            // Safer: Just rely on metadata for now, and handle profile 'upsert' with role later.

            // Check if email confirmation is required (session will be null)
            if (!data.session) {
                return { success: true, confirmationRequired: true };
            }

            // Set local state immediately for responsiveness
            setUser({
                id: data.user.id,
                name,
                email,
                image: '',
                role: role
            });

            // Force profile create/update with Role
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email,
                name,
                role
            });

            return { success: true };
        }

        return { success: false, error: 'Signup failed unexpected' };
    };

    const updateUser = async (data: Partial<User>) => {
        if (!user) return;

        const updates: any = {};
        if (data.name) updates.name = data.name;
        if (data.username) updates.username = data.username;
        if (data.image) updates.avatar_url = data.image;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        setUser(prev => {
            const updated = prev ? { ...prev, ...data } : null;
            if (updated) localStorage.setItem('specyf_user', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        // Force clear local storage to prevent stale tokens from freezing the app on next login
        localStorage.clear(); // This clears everything including specyf_user
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateUser, loading }}>
            {loading ? (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        color: 'var(--primary-600, #4F46E5)'
                    }}>
                        <div className="loading-spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #f3f3f3',
                            borderTop: '3px solid currentColor',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <style>{`
@keyframes spin {
    0 % { transform: rotate(0deg); }
    100 % { transform: rotate(360deg); }
}
`}</style>
                        <span style={{ fontFamily: 'system-ui', fontSize: '1.125rem', fontWeight: 500 }}>
                            Loading Specyf...
                        </span>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
