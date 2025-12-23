import { useRef, useState, useEffect } from 'react';
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

    const [messages, setMessages] = useState<any[]>([]);
    const [chatInfo, setChatInfo] = useState<any | null>(null);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const downloadImage = (base64Str: string) => {
        const link = document.createElement('a');
        link.href = base64Str;
        link.download = `petmatch-shared-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    // Handle initial pet interest message (moved to top level)
    useEffect(() => {
        if (!loading && messages.length === 0 && location.state?.prefill && !autoSentRef.current && user) {
            autoSentRef.current = true;
            chatService.sendMessage(chatId, user.id, location.state.prefill);
            // Clear location state so refresh doesn't resend
            window.history.replaceState({}, document.title);
        }
    }, [loading, messages, location.state, user, chatId]);

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

    if (loading || !chatInfo) return (
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
                padding: '1.5rem 1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px', // Smaller gap for WhatsApp style
                background: '#e5ddd5', // Classic WhatsApp beige background
                // Optional: Add a subtle pattern if you want to go the extra mile
            }}>
                {messages.map((msg, index) => {
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
                                    className={isMe ? 'message-bubble-me' : 'message-bubble-other'}
                                    style={{
                                        padding: '6px 7px 8px 9px',
                                        background: isMe ? '#dcf8c6' : '#ffffff',
                                        color: '#111b21',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.4,
                                        position: 'relative',
                                        minWidth: '60px'
                                    }}
                                >
                                    {/* Tail for "Me" */}
                                    {isMe && (
                                        <div style={{
                                            position: 'absolute',
                                            right: '-8px',
                                            top: 0,
                                            width: '12px',
                                            height: '13px',
                                            background: '#dcf8c6',
                                            clipPath: 'polygon(0 0, 0 100%, 100% 0)'
                                        }} />
                                    )}
                                    {/* Tail for "Other" */}
                                    {!isMe && (
                                        <div style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            top: 0,
                                            width: '12px',
                                            height: '13px',
                                            background: '#ffffff',
                                            clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
                                        }} />
                                    )}
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
                                                paddingBottom: '2px'
                                            }}>
                                                {msg.text}
                                            </div>
                                        )}
                                        <div style={{
                                            fontSize: '0.65rem',
                                            color: '#667781',
                                            paddingTop: '4px',
                                            userSelect: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px'
                                        }}>
                                            {timeString}
                                            {isMe && (
                                                <span style={{ color: '#53bdeb', fontSize: '10px', marginLeft: '2px' }}>✓✓</span>
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
            <div style={{ background: '#f0f2f5', borderTop: '1px solid var(--gray-200)', padding: '0.5rem 0.5rem 1rem' }}>
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
                        padding: '0.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        maxWidth: '1000px',
                        margin: '0 auto',
                        width: '100%'
                    }}
                >
                    <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        background: 'white',
                        borderRadius: '24px',
                        padding: '0.25rem 0.5rem',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                    }}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => imageInputRef.current?.click()}
                            style={{ padding: '0.6rem', borderRadius: '50%', color: '#54656f' }}
                        >
                            <ImageSquare size={24} weight="regular" />
                        </Button>

                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message"
                            style={{
                                flex: 1,
                                padding: '0.6rem 0.5rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1rem',
                                outline: 'none',
                                color: '#111b21',
                                minWidth: 0
                            }}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!inputText.trim() && !selectedImage}
                        style={{
                            padding: '0',
                            borderRadius: '50%',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#00a884', // WhatsApp green
                            border: 'none',
                            color: 'white',
                            flexShrink: 0,
                            boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                        }}
                    >
                        <PaperPlaneRight size={22} weight="fill" />
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
