import { useState, useMemo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { chatService } from '../lib/chatService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CalendarBlank, MagnifyingGlass, ChatCircleDots } from '@phosphor-icons/react';
import Card from './Card';

interface ChatListProps {
    onSelectChat?: () => void; // Optional callback for mobile closing
    className?: string;
    style?: React.CSSProperties;
}

const ChatList = ({ onSelectChat, className, style }: ChatListProps) => {
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
    const filteredChats = useMemo(() => {
        if (!chats) return [];
        if (!searchQuery) return chats;

        return chats.filter(c => {
            const name = c.other_user?.name || 'Unknown';
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [chats, searchQuery]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 2. Discover New Users matching search - Helper for future use
    const discoveredUsers: any[] = [];



    return (
        <div className={`chat-list fade-in ${className || ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
            {/* Header */}
            <div style={{ padding: '2rem 2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', background: 'var(--primary-100)', borderRadius: '12px', color: 'var(--primary-600)' }}>
                        <ChatCircleDots size={28} weight="duotone" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)' }}>Messages</h1>
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
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            background: 'white',
                            border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: '0.95rem',
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

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Empty State */}
                {!loading && filteredChats.length === 0 && (
                    <Card style={{ padding: '2rem 1rem', textAlign: 'center', background: 'white', border: '1px dashed var(--gray-300)' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--gray-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CalendarBlank size={32} weight="duotone" color="var(--gray-400)" />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '0.25rem' }}>No chats</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Search to find people</p>
                    </Card>
                )}

                {/* Discovered Users (Code Placeholder) */}
                {discoveredUsers.length > 0 && ( /* ... */ null)}

                {/* Chats */}
                {(filteredChats.length > 0) && (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {filteredChats.map(chat => {
                            const name = chat.other_user?.name || 'Unknown';
                            const avatar = chat.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${name}&background=random`;

                            return (
                                <NavLink
                                    key={chat.id}
                                    to={`/messages/${chat.id}`}
                                    onClick={onSelectChat}
                                    style={({ isActive }) => ({
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        borderRadius: 'var(--radius-lg)',
                                        transition: 'all 0.2s',
                                        background: isActive ? 'var(--primary-50)' : 'transparent',
                                        border: isActive ? '1px solid var(--primary-200)' : '1px solid transparent'
                                    })}
                                >
                                    <div style={{
                                        padding: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                    }}>
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={avatar}
                                                alt={name}
                                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-900)' }}>{name}</h3>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{formatTime(chat.last_message_time)}</span>
                                            </div>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--gray-500)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {chat.last_message || 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </NavLink>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
