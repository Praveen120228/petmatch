import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    username?: string;
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
        let mounted = true;

        // 1. Get initial session
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!mounted) return;

                if (error) {
                    console.error("Auth: Session validation error:", error);
                }

                if (session?.user) {
                    console.log("Auth: Session restored for", session.user.email);
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.email!.split('@')[0],
                        image: ''
                    });
                    // Fetch full profile in background
                    fetchProfile(session.user.id, session.user.email!);
                } else {
                    console.log("Auth: No active session found.");
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth: Initialization error:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initSession();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            console.log(`Auth: Event occurred "${event}"`);

            if (session?.user) {
                // If user was previously null or different, update state
                setUser(prev => {
                    // Avoid unnecessary re-renders if ID matches
                    if (prev?.id === session.user.id) return prev;

                    return {
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.email!.split('@')[0],
                        image: ''
                    };
                });

                // Always fetch profile on sign-in (could optimize to only if id changed)
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    fetchProfile(session.user.id, session.user.email!);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        console.log("Auth: Fetching profile from DB...");
        try {
            // 1. Attempt to fetch
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // 2. If missing, attempt to create (handle race conditions)
            if (error) {
                console.log('Auth: Profile missing, attempting creation...');

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
                    // Check for conflict (409) or other errors that imply it exists now
                    // Postgres error 23505 is unique_violation
                    if (createError.code === '23505' || createError.message.includes('duplicate key')) {
                        console.log("Auth: Profile creation conflict, fetching existing...");
                        // Retry fetch
                        const { data: retryData, error: retryError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', userId)
                            .single();

                        if (retryData) {
                            data = retryData;
                            error = null;
                        } else {
                            console.error("Auth: Failed to fetch profile after conflict:", retryError);
                        }
                    } else if (createError.code === '23503') {
                        // Error 23503: Foreign key violation (auth.uid() does not exist in auth.users)
                        // This happens if the user was deleted from DB but local session persists
                        console.error("Auth: Stale session detected (User missing in DB). Forcing logout.");
                        await logout();
                        return;
                    } else {
                        console.error('Failed to auto-create profile:', createError);
                        // Fallback to local state only if creation failed and data is still missing
                        setUser(prev => prev || { id: userId, name: email.split('@')[0], email: email });
                        return;
                    }
                } else {
                    data = newProfile;
                    error = null;
                    console.log("Auth: Profile auto-created");
                }
            }

            // 3. Update State with final data
            if (data) {
                console.log("Auth: Profile loaded, updating user state");
                setUser({
                    id: data.id,
                    name: data.name || email.split('@')[0],
                    email: data.email || email,
                    image: data.avatar_url,
                    username: data.username
                });
            }
        } catch (error) {
            console.error('Profile fetch unexpected error:', error);
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
        if (data.username) updates.username = data.username;
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
        // Force clear local storage to prevent stale tokens from freezing the app on next login
        localStorage.clear();
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
