import { useEffect } from 'react';
import { PawPrint, User, Check } from '@phosphor-icons/react';

interface SuccessOverlayProps {
    type: 'signup' | 'onboarding';
    onComplete?: () => void;
}

const SuccessOverlay = ({ type, onComplete }: SuccessOverlayProps) => {

    useEffect(() => {
        // Auto-complete after animation + reading time
        const timer = setTimeout(() => {
            onComplete?.();
        }, 2200);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className="fade-in"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 50,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem'
            }}
        >
            {type === 'signup' && (
                <div style={{ animation: 'scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {/* Paw Stamp Animation */}
                    <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.5)',
                        position: 'relative'
                    }}>
                        <PawPrint size={64} weight="fill" color="white" />
                        <div style={{
                            position: 'absolute',
                            inset: -8,
                            border: '2px solid var(--primary-300)',
                            borderRadius: '50%',
                            animation: 'ripple 1.5s infinite'
                        }} />
                    </div>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: 'var(--gray-900)',
                        marginBottom: '0.5rem'
                    }}>
                        Welcome to the Pack!
                    </h2>
                    <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem' }}>Your journey starts now.</p>
                </div>
            )}

            {type === 'onboarding' && (
                <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {/* Profile Verified Badge */}
                    <div style={{
                        position: 'relative',
                        marginBottom: '2rem',
                        display: 'inline-block'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--gray-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid white',
                            boxShadow: 'var(--shadow-lg)'
                        }}>
                            <User size={48} weight="duotone" color="var(--gray-400)" />
                        </div>

                        {/* Checkmark Badge Pop */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: -10,
                            background: 'var(--success)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid white',
                            boxShadow: 'var(--shadow-md)',
                            animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards'
                        }}>
                            <Check size={20} weight="bold" />
                        </div>
                    </div>

                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: 'var(--gray-900)',
                        marginBottom: '0.5rem'
                    }}>
                        You Look Great!
                    </h2>
                    <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem' }}>Your profile is ready for action.</p>
                </div>
            )}

            <style>{`
                @keyframes scaleUp {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes ripple {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes popIn {
                    0% { transform: scale(0); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default SuccessOverlay;
