import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatService } from '../lib/chatService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CalendarBlank, MagnifyingGlass, Plus, ChatCircleDots } from '@phosphor-icons/react';
import Card from '../components/Card';

const Messages = () => {
    // const navigate = useNavigate();
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadChats = async () => {
            setLoading(true);
            try {
                const data = await chatService.getConversations(user.id);
                setChats(data || []);
            } catch (err) {
                console.error("Failed to load chats", err);
            } finally {
                setLoading(false);
            }
        };
        loadChats();

        // Subscribe to conversation updates
        const channel = supabase
            .channel(`conversations_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `participant_a=eq.${user.id}`
                },
                () => loadChats()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `participant_b=eq.${user.id}`
                },
                () => loadChats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // --- Search Logic ---
    // 1. Existing Chats matching search
    const filteredChats = useMemo(() => {
        if (!chats) return [];
        if (!searchQuery) return chats;

        // Need to filter by the OTHER user's name.
        // The chat object has joined profile data.
        return chats.filter(c => {
            const isA = c.participant_a === user?.id;
            const otherUser = isA ? c.participant_b_profile : c.participant_a_profile;
            const name = otherUser?.name || 'Unknown';
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [chats, searchQuery, user]);

    // 2. Discover New Users matching search
    // TODO: Migrate to Supabase search
    const discoveredUsers: any[] = [];

    const handleStartChat = async () => {
        if (!user) return;
        try {
            // Need owner ID. Local mock pets stores 'owner' name. 
            // We need real IDs.
            // For now, disabling mock discovery.
            console.warn("Starting chat from mock discovery not supported yet via Supabase");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', minHeight: '100vh', padding: '0 2rem' }}>

            {/* Header */}
            <div style={{ padding: '3rem 0 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', background: 'var(--primary-100)', borderRadius: '12px', color: 'var(--primary-600)' }}>
                        <ChatCircleDots size={32} weight="duotone" />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)' }}>Messages</h1>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                    <MagnifyingGlass
                        size={20}
                        color="var(--gray-400)"
                        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                        type="text"
                        placeholder="Search for people or existing chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            background: 'white',
                            border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s',
                            color: 'var(--gray-800)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary-300)';
                            e.target.style.boxShadow = '0 0 0 3px var(--primary-100)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--gray-200)';
                            e.target.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    />
                </div>
            </div>

            {/* Lists */}
            <div style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Case 0: Empty State */}
                {!loading && filteredChats.length === 0 && (
                    <Card style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white', border: '1px dashed var(--gray-300)' }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--gray-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CalendarBlank size={40} weight="duotone" color="var(--gray-400)" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '0.5rem' }}>No messages yet</h3>
                        <p style={{ color: 'var(--gray-500)' }}>Connect with pet owners to start chatting!</p>
                    </Card>
                )}

                {/* Case 1: Search Results - New Users */}
                {discoveredUsers.length > 0 && (
                    <section>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Start a new conversation</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {discoveredUsers.map((pet: any) => (
                                <Card
                                    key={pet.owner}
                                    interactive
                                    padding="md"
                                    onClick={() => handleStartChat()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--gray-100)' }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden' }}>
                                            <img src={`https://ui-avatars.com/api/?name=${pet.owner}&background=random`} alt={pet.owner} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                        <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'white', borderRadius: '50%', padding: '2px' }}>
                                            <div style={{ background: 'var(--primary-500)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={12} color="white" weight="bold" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{pet.owner}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>Owner of {pet.name}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Case 2: Existing Chats */}
                {(filteredChats.length > 0 || discoveredUsers.length > 0) && filteredChats.length > 0 && (
                    <section>
                        {searchQuery && <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Recent Chats</h3>}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {filteredChats.map(chat => (
                                <Link key={chat.id} to={`/messages/${chat.id}`} style={{ textDecoration: 'none' }}>
                                    <Card
                                        hover
                                        padding="md"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1.25rem',
                                            background: chat.unread ? 'var(--primary-50)' : 'white',
                                            border: chat.unread ? '1px solid var(--primary-200)' : '1px solid var(--gray-100)'
                                        }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={chat.avatar}
                                                alt={chat.name}
                                                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            {chat.unread > 0 && (
                                                <span style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', background: 'var(--error)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></span>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: chat.unread ? 800 : 700, color: 'var(--gray-900)' }}>{chat.name}</h3>
                                                <span style={{ fontSize: '0.85rem', color: chat.unread ? 'var(--primary-600)' : 'var(--gray-500)', fontWeight: chat.unread ? 600 : 400 }}>{chat.time}</span>
                                            </div>
                                            <p style={{
                                                fontSize: '1rem',
                                                color: chat.unread ? 'var(--gray-900)' : 'var(--gray-500)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontWeight: chat.unread ? 600 : 400
                                            }}>
                                                {chat.lastMessage}
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* No Search Results */}
                {searchQuery && filteredChats.length === 0 && discoveredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                        <p style={{ fontSize: '1.1rem' }}>No results found for "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
