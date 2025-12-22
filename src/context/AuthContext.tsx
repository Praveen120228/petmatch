import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
    updateUser: (data: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize Auth State & Listen for Changes
    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setLoading(false);
            }
        }).catch((err) => {
            console.error('Session fetch error:', err);
            setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.log('Profile missing or error, attempting creation...', error);
                // Attempt to Create Profile (Lazy init for old users or race conditions)
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: email,
                        name: email.split('@')[0],
                        avatar_url: ''
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Failed to auto-create profile:', createError);
                    // Fallback to local state only
                    setUser({ id: userId, name: email.split('@')[0], email: email });
                } else {
                    setUser({
                        id: newProfile.id,
                        name: newProfile.name,
                        email: newProfile.email,
                        image: newProfile.avatar_url
                    });
                }
            } else if (data) {
                setUser({
                    id: data.id,
                    name: data.name || email.split('@')[0],
                    email: data.email || email,
                    image: data.avatar_url
                });
            }
        } catch (error) {
            console.error('Profile fetch unexpected error:', error);
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

    const signup = async (name: string, email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name } // Passed to metadata, can be used by triggers
            }
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
            // Check if email confirmation is required (session will be null)
            if (!data.session) {
                return { success: true, confirmationRequired: true };
            }

            // Manually insert profile to ensure it exists immediately
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                email: email,
                name: name,
                avatar_url: ''
            });

            if (profileError) {
                console.warn('Profile creation warning:', profileError.message);
            }

            // Set local state immediately for responsiveness
            setUser({
                id: data.user.id,
                name,
                email,
                image: ''
            });

            return { success: true };
        }

        return { success: false, error: 'Signup failed unexpected' };
    };

    const updateUser = async (data: Partial<User>) => {
        if (!user) return;

        const updates: any = {};
        if (data.name) updates.name = data.name;
        if (data.image) updates.avatar_url = data.image;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        setUser(prev => prev ? { ...prev, ...data } : null);
    };

    const logout = async () => {
        await supabase.auth.signOut();
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
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                        <span style={{ fontFamily: 'system-ui', fontSize: '1.125rem', fontWeight: 500 }}>
                            Loading PetMatch...
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
