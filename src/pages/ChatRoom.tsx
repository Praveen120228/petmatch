import SEO from '../components/SEO';
import { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CaretLeft, PaperPlaneRight, DotsThreeVertical, ImageSquare, X, DownloadSimple } from '@phosphor-icons/react';
import { chatService } from '../lib/chatService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../lib/storageService';
import Button from '../components/Button';

const ChatRoom = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const chatId = Number(id);
    const bottomRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const autoSentRef = useRef(false);

    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const downloadImage = (base64Str: string) => {
        const link = document.createElement('a');
        link.href = base64Str;
        link.download = `petmatch-shared-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const queryClient = useQueryClient();

    // 1. Fetch Chat Info
    const { data: chatInfo, isLoading: isChatLoading } = useQuery({
        queryKey: ['chat', chatId], // simple key for info
        queryFn: async () => {
            if (!user) return null;
            return await chatService.getConversation(chatId, user.id);
        },
        enabled: !!user && !!chatId
    });

    // 2. Fetch Messages
    const { data: messages = [], isLoading: isMsgsLoading } = useQuery({
        queryKey: ['messages', chatId],
        queryFn: async () => {
            const msgs = await chatService.getMessages(chatId);
            return msgs || [];
        },
        enabled: !!chatId,
        staleTime: Infinity, // Rely on realtime updates
    });

    // Side effect: Mark as read when messages load
    useEffect(() => {
        if (user && chatId && messages.length > 0) {
            // Check if last message is unread and from other? 
            // Or just mark read. Service handles logic usually.
            chatService.markAsRead(chatId, user.id);
        }
    }, [chatId, user, messages.length]);


    // Realtime Subscription
    useEffect(() => {
        if (!chatId || !user) return;

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
                    const newMsg = payload.new;

                    // Update Cache
                    queryClient.setQueryData(['messages', chatId], (old: any[] | undefined) => {
                        const prev = old || [];
                        // Deduplicate
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // If message is from someone else, mark as read immediately
                    if (newMsg.sender_id !== user.id) {
                        chatService.markAsRead(chatId, user.id);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${chatId}`
                },
                (payload) => {
                    const updatedMsg = payload.new;

                    // Update Cache
                    queryClient.setQueryData(['messages', chatId], (old: any[] | undefined) => {
                        const prev = old || [];
                        return prev.map(m => m.id === updatedMsg.id ? updatedMsg : m);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, user, queryClient]);

    // Handle initial pet interest message (moved to top level)
    useEffect(() => {
        if (!isMsgsLoading && messages.length === 0 && location.state?.prefill && !autoSentRef.current && user) {
            autoSentRef.current = true;
            chatService.sendMessage(chatId, user.id, location.state.prefill);
            // Clear location state so refresh doesn't resend
            window.history.replaceState({}, document.title);
        }
    }, [isMsgsLoading, messages, location.state, user, chatId]);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                // Scroll to bottom to show preview
                scrollToBottom();
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const renderContentWithLinks = (text: string) => {
        if (!text) return null;

        // Regex to find URLs (starting with http://, https://, or www.)
        const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;

        return text.split(urlRegex).map((part, index) => {
            if (part.match(urlRegex)) {
                let href = part;
                if (!href.startsWith('http')) {
                    href = `https://${href}`;
                }
                return (
                    <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part; // Return text as is
        });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputText.trim() && !selectedImage) || !user) return;

        try {
            const textIdx = inputText;

            // 1. Upload Image if present (Base64)
            let imageIdx = selectedImage || undefined;
            if (selectedImage && selectedImage.startsWith('data:')) {
                // Optimistic clear happens after trigger, but we need blob first
                const blob = storageService.base64ToBlob(selectedImage);
                imageIdx = await storageService.uploadChatImage(blob, chatId);
            }

            // Optimistic clear
            setInputText('');
            setSelectedImage(null);

            await chatService.sendMessage(chatId, user.id, textIdx, imageIdx);
            // New message will come via subscription
        } catch (err) {
            console.error("Failed to send", err);
            // Optionally restore text on error
        }
    };

    if (isChatLoading || !chatInfo) return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--gray-500)' }}>Loading chat...</span>
        </div>
    );

    // Determine "Other" User for display
    const otherUser = chatInfo.other_user;
    const otherUserName = otherUser?.name || 'Unknown User';
    const otherUserAvatar = otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUserName}&background=random`;
    const petName = chatInfo.pet?.name || 'Pet';

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
            <SEO title={otherUserName ? `Chat with ${otherUserName}` : 'Chat'} />

            <style>{`
                @media (min-width: 768px) {
                    .hide-on-desktop { display: none !important; }
                }
            `}</style>

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
                    className="hide-on-desktop"
                    style={{ padding: '0.5rem', borderRadius: '50%' }}
                >
                    <CaretLeft size={24} weight="bold" />
                </Button>

                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => otherUser?.id && navigate(`/user/${otherUser.id}`)}
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
                {messages.map((msg: any, index) => {
                    const isMe = msg.sender_id === user?.id;
                    const date = new Date(msg.created_at);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Date divider logic
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
                    const showDateDivider = !prevDate || date.toDateString() !== prevDate.toDateString();

                    let dateDividerText = date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);

                    if (date.toDateString() === today.toDateString()) {
                        dateDividerText = 'TODAY';
                    } else if (date.toDateString() === yesterday.toDateString()) {
                        dateDividerText = 'YESTERDAY';
                    }

                    return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            {showDateDivider && (
                                <div style={{
                                    alignSelf: 'center',
                                    margin: '1.5rem 0 1rem',
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#54656f',
                                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                                    textTransform: 'uppercase'
                                }}>
                                    {dateDividerText}
                                </div>
                            )}
                            <div
                                style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: isMe
                                            ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' // Lighter purple (Violet-400 to Violet-500)
                                            : 'white',
                                        color: isMe ? 'white' : 'var(--gray-800)',
                                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                        boxShadow: isMe ? 'var(--shadow-colored)' : 'var(--shadow-sm)',
                                        border: isMe ? 'none' : '1px solid var(--gray-200)',
                                        fontSize: '1rem',
                                        lineHeight: 1.5,
                                        position: 'relative'
                                    }}
                                >
                                    {msg.image && (
                                        <div style={{ marginBottom: msg.text ? '4px' : 0 }}>
                                            <img
                                                src={msg.image}
                                                alt="Attachment"
                                                onClick={() => setViewingImage(msg.image)}
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '300px',
                                                    borderRadius: '6px',
                                                    display: 'block',
                                                    objectFit: 'cover',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '8px' }}>
                                        {msg.text && (
                                            <div style={{
                                                whiteSpace: 'pre-wrap',
                                                flex: 1,
                                                minWidth: '50px',
                                                alignSelf: 'flex-start',
                                                paddingBottom: '2px',
                                                wordBreak: 'break-word' // Ensure long links wrap
                                            }}>
                                                {renderContentWithLinks(msg.text)}
                                            </div>
                                        )}
                                        <div style={{
                                            fontSize: '0.65rem',
                                            color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--gray-400)',
                                            paddingTop: '4px',
                                            userSelect: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px',
                                            justifyContent: 'flex-end'
                                        }}>
                                            {timeString}
                                            {isMe && (
                                                <span style={{
                                                    color: msg.read ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    marginLeft: '4px'
                                                }}>
                                                    {msg.read ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div style={{ background: 'white', borderTop: '1px solid var(--gray-200)' }}>

                {/* Image Preview */}
                {selectedImage && (
                    <div style={{ padding: '0.5rem 1rem', display: 'flex' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={selectedImage}
                                alt="Preview"
                                style={{ height: '80px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                style={{
                                    position: 'absolute', top: -8, right: -8,
                                    background: 'var(--gray-900)', color: 'white',
                                    border: 'none', borderRadius: '50%',
                                    width: '24px', height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={14} weight="bold" />
                            </button>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSend}
                    style={{
                        padding: '1rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                    }}
                >
                    <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => imageInputRef.current?.click()}
                        style={{ padding: '1rem', borderRadius: '50%', color: 'var(--gray-500)' }}
                    >
                        <ImageSquare size={24} />
                    </Button>

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
                        disabled={!inputText.trim() && !selectedImage}
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
            {/* Lightbox Overlay */}
            {viewingImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }} onClick={() => setViewingImage(null)}>

                    {/* Toolbar */}
                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => downloadImage(viewingImage)}
                            style={{
                                background: 'white', border: 'none', borderRadius: '50%',
                                width: '40px', height: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', opacity: 0.9
                            }}
                            title="Download"
                        >
                            <DownloadSimple size={20} color="black" />
                        </button>
                        <button
                            onClick={() => setViewingImage(null)}
                            style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                                width: '40px', height: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'white'
                            }}
                        >
                            <X size={24} weight="bold" />
                        </button>
                    </div>

                    <img
                        src={viewingImage}
                        alt="Full size"
                        style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatRoom;
