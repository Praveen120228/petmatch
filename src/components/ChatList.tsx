import { useState, useMemo, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { chatService } from '../lib/chatService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { userService } from '../lib/userService';
import { CalendarBlank, MagnifyingGlass, ChatCircleDots, UserPlus } from '@phosphor-icons/react';
import Card from './Card';

interface ChatListProps {
    onSelectChat?: () => void; // Optional callback for mobile closing
    className?: string;
    style?: React.CSSProperties;
}

const ChatList = ({ onSelectChat, className, style }: ChatListProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [discoveredUsers, setDiscoveredUsers] = useState<any[]>([]);

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

        // 1. Subscribe to conversation metadata updates (last_message, etc)
        const convChannel = supabase
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

        // 2. Subscribe to new messages globally to update unread counts and move to top
        const msgChannel = supabase
            .channel(`global_messages_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                    // We can't easily filter by "involved conversations" here in a single filter string, 
                    // but we can filter by the payload in the callback or just refresh everything.
                },
                () => {
                    // Check if this message involves the user
                    // (Actually loadChats is safer and handles sorting)
                    loadChats();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    // Refresh if a message was marked as read (to update count)
                    loadChats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(convChannel);
            supabase.removeChannel(msgChannel);
        };
    }, [user]);

    // --- Search Logic ---
    const filteredChats = useMemo(() => {
        if (!chats) return [];
        if (!searchQuery) return chats;

        return chats.filter(c => {
            const name = c.other_user?.name || 'Unknown';
            const username = c.other_user?.username || '';
            const q = searchQuery.toLowerCase();
            return name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
        });
    }, [chats, searchQuery]);

    // Global User Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setDiscoveredUsers([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const users = await userService.searchUsers(searchQuery);
                // Filter out self and existing chats
                const existingIds = chats.map(c => c.other_user?.id);
                // Also filter out self (user.id checks if needed, query handled in db but filtering distinct)
                if (user) {
                    const filtered = users.filter((u: any) => u.id !== user.id && !existingIds.includes(u.id));
                    setDiscoveredUsers(filtered);
                }
            } catch (err) {
                console.error(err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, chats, user]);

    const handleStartChat = async (otherId: string) => {
        if (!user) return;
        try {
            const chatId = await chatService.createConversation(user.id, otherId);
            // Refresh list or nav
            navigate(`/messages/${chatId}`);
            if (onSelectChat) onSelectChat();
        } catch (e) {
            alert("Failed to start chat");
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };



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

                {/* Discovered Users Section */}
                {searchQuery && discoveredUsers.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>People</h4>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {discoveredUsers.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => handleStartChat(u.id)}
                                    style={{
                                        padding: '0.75rem',
                                        background: 'var(--gray-50)',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                >
                                    <img
                                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`}
                                        alt={u.name}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-900)' }}>{u.name}</h4>
                                        {u.username && <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>@{u.username}</span>}
                                    </div>
                                    <div style={{ padding: '0.5rem', background: 'white', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <UserPlus size={18} color="var(--primary-600)" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chats */}
                {(filteredChats.length > 0) && (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {filteredChats.map(chat => {
                            const name = chat.other_user?.name || 'Unknown';
                            const avatar = chat.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${name}&background=random`;
                            const hasUnread = chat.unread_count > 0;

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
                                            {/* Online status indicator could go here */}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                <h3 style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: hasUnread ? 800 : 600,
                                                    color: 'var(--gray-900)'
                                                }}>{name}</h3>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: hasUnread ? 'var(--primary-600)' : 'var(--gray-500)',
                                                    fontWeight: hasUnread ? 700 : 400
                                                }}>
                                                    {formatTime(chat.last_message_time)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                                                    {/* If last message was sent by me, show status */}
                                                    {chat.last_message && chat.last_sender_id === user?.id && (
                                                        <span style={{
                                                            fontSize: '12px',
                                                            color: 'var(--gray-400)',
                                                            lineHeight: 1
                                                        }}>✓</span>
                                                    )}
                                                    <p style={{
                                                        fontSize: '0.825rem',
                                                        color: hasUnread ? 'var(--gray-900)' : 'var(--gray-500)',
                                                        fontWeight: hasUnread ? 500 : 400,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        flex: 1
                                                    }}>
                                                        {chat.last_message || 'No messages yet'}
                                                    </p>
                                                </div>
                                                {hasUnread && (
                                                    <div style={{
                                                        background: 'var(--primary-600)',
                                                        color: 'white',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        borderRadius: '50%',
                                                        minWidth: '20px',
                                                        height: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginLeft: '8px',
                                                        padding: '0 4px'
                                                    }}>
                                                        {chat.unread_count}
                                                    </div>
                                                )}
                                            </div>
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
