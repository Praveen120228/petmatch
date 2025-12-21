import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CaretLeft, PaperPlaneRight, DotsThreeVertical } from '@phosphor-icons/react';
import { chatService } from '../lib/chatService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const ChatRoom = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const chatId = Number(id);
    const bottomRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [chatInfo, setChatInfo] = useState<any | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chatId || !user) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Chat Info
                const chat = await chatService.getConversation(chatId, user.id);
                setChatInfo(chat);

                // 2. Fetch Messages
                const msgs = await chatService.getMessages(chatId);
                setMessages(msgs || []);
            } catch (err) {
                console.error("Failed to load chat", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // 3. Subscribe to Realtime Messages
        const channel = supabase
            .channel(`chat_${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${chatId}`
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, user]);

    // Scroll to bottom
    const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth') => {
        bottomRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, [chatInfo]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user) return;

        try {
            const textIdx = inputText;
            setInputText(''); // Optimistic clear
            await chatService.sendMessage(chatId, user.id, textIdx);
            // New message will come via subscription
        } catch (err) {
            console.error("Failed to send", err);
            // Optionally restore text on error
        }
    };

    if (loading || !chatInfo) return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--gray-500)' }}>Loading chat...</span>
        </div>
    );

    // Determine "Other" User for display
    const otherUser = chatInfo.other_user;
    const otherUserName = otherUser?.name || 'Unknown User';
    const otherUserAvatar = otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUserName}&background=random`;
    const petName = chatInfo.pet?.name || 'Pet';

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', background: 'white' }}>

            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem', // Reduced padding for mobile
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: '1px solid var(--gray-200)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/messages')}
                    style={{ padding: '0.5rem', borderRadius: '50%' }}
                >
                    <CaretLeft size={24} weight="bold" />
                </Button>

                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => navigate(`/messages/${chatId}/info`)}
                >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray-100)', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={otherUserAvatar} alt={otherUserName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{otherUserName}</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Re: {petName}</p>
                    </div>
                </div>

                <Button variant="ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <DotsThreeVertical size={24} weight="regular" />
                </Button>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '2rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: 'var(--gray-50)'
            }}>
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div
                                style={{
                                    padding: '1rem 1.25rem',
                                    background: isMe
                                        ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))'
                                        : 'white',
                                    color: isMe ? 'white' : 'var(--gray-800)',
                                    borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    boxShadow: isMe ? 'var(--shadow-colored)' : 'var(--shadow-sm)',
                                    border: isMe ? 'none' : '1px solid var(--gray-200)',
                                    fontSize: '1rem',
                                    lineHeight: 1.5
                                }}
                            >
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleSend}
                style={{
                    padding: '1rem', // Reduced padding
                    background: 'white',
                    borderTop: '1px solid var(--gray-200)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                }}
            >
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                        flex: 1,
                        padding: '1rem 1.5rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--gray-200)',
                        background: 'var(--gray-50)',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        color: 'var(--gray-900)'
                    }}
                    onFocus={e => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = 'var(--primary-400)';
                        e.target.style.boxShadow = '0 0 0 4px var(--primary-50)';
                    }}
                    onBlur={e => {
                        e.target.style.background = 'var(--gray-50)';
                        e.target.style.borderColor = 'var(--gray-200)';
                        e.target.style.boxShadow = 'none';
                    }}
                />
                <Button
                    type="submit"
                    variant="primary"
                    disabled={!inputText.trim()}
                    style={{
                        padding: '1rem',
                        borderRadius: '50%',
                        width: '54px',
                        height: '54px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <PaperPlaneRight size={24} weight="fill" />
                </Button>
            </form>
        </div>
    );
};

export default ChatRoom;
