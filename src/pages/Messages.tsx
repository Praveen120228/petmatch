import { Outlet, useParams } from 'react-router-dom';
import ChatList from '../components/ChatList';
import { ChatCircleDots } from '@phosphor-icons/react';

const Messages = () => {
    const { id } = useParams();
    const isMobileChatActive = !!id;

    return (
        <div className="fade-in" style={{
            height: 'calc(100vh - 64px)', // Deduct navbar height
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div className="messages-layout" style={{ height: '100%', display: 'flex' }}>

                {/* Left Sidebar */}
                <div
                    className="messages-sidebar"
                    style={{
                        width: '100%', // Mobile default
                        height: '100%',
                        borderRight: '1px solid var(--gray-200)',
                        background: 'white',
                        display: isMobileChatActive ? 'none' : 'flex', // Mobile toggle
                        flexDirection: 'column'
                    }}
                >
                    <ChatList />
                </div>

                {/* Right Content Area */}
                <div
                    className="messages-content"
                    style={{
                        flex: 1,
                        height: '100%',
                        position: 'relative',
                        display: isMobileChatActive ? 'block' : 'none', // Mobile toggle
                        background: 'white'
                    }}
                >
                    <Outlet />
                </div>
            </div>

            <style>{`
                @media (min-width: 768px) {
                    .messages-sidebar {
                        width: 320px !important; /* Fixed width sidebar */
                        display: flex !important; /* Always show on desktop */
                    }
                    .messages-content {
                        display: block !important; /* Always show on desktop */
                    }
                }
                @media (min-width: 1024px) {
                    .messages-sidebar {
                        width: 380px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export const MessagesPlaceholder = () => (
    <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gray-400)',
        background: 'var(--gray-50)'
    }}>
        <div style={{
            padding: '2rem',
            background: 'var(--primary-50)',
            borderRadius: '50%',
            marginBottom: '1.5rem'
        }}>
            <ChatCircleDots size={64} weight="duotone" color="var(--primary-300)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Your Messages</h2>
        <p style={{ color: 'var(--gray-500)' }}>Select a conversation to start chatting</p>
    </div>
);

export default Messages;
