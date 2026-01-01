import { useState, useEffect } from 'react';
import { MagicWand, X, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { journeyService } from '../lib/journeyService';
import type { Milestone, UserProgress } from '../lib/journeyService';
import { Link } from 'react-router-dom';

const JourneyWidget = () => {
    const { user } = useAuth();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [progress, setProgress] = useState<UserProgress[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    // Persist minimize state
    const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem('journey_minimized') === 'true');

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            if (!user) return;
            const ms = await journeyService.getMilestones();
            const pr = await journeyService.getUserProgress(user.id);
            setMilestones(ms);
            setProgress(pr);

            // Check if all done
            const allComplete = ms.every(m => pr.find(p => p.milestone_slug === m.slug)?.status === 'completed');
            if (allComplete) setIsVisible(false); // Hide if everything is done? Or show completion badge.

        } catch (e) {
            console.error(e);
        }
    };

    // Get current tip
    const tipData = journeyService.getPersonalizedTip(progress, milestones);

    if (!isVisible || !tipData) return null;

    const toggleMinimize = () => {
        const newState = !isMinimized;
        setIsMinimized(newState);
        localStorage.setItem('journey_minimized', String(newState));
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100,
            maxWidth: isMinimized ? 'auto' : '350px',
            width: '100%',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }} className="fade-in">
            {isMinimized ? (
                <div
                    onClick={toggleMinimize}
                    style={{
                        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '50%',
                        boxShadow: 'var(--shadow-lg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}
                >
                    <MagicWand size={24} weight="duotone" />
                    {/* Badge */}
                    <div style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: '12px',
                        height: '12px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        border: '2px solid white'
                    }} />
                </div>
            ) : (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        background: 'linear-gradient(90deg, var(--primary-50), white)',
                        borderBottom: '1px solid var(--gray-100)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                padding: '6px',
                                background: 'var(--primary-100)',
                                borderRadius: '8px',
                                color: 'var(--primary-600)'
                            }}>
                                <MagicWand size={18} weight="fill" />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)' }}>
                                Journey Guide
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={toggleMinimize} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray-400)' }}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--gray-900)' }}>
                            {tipData.title}
                        </h4>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: '1.5' }}>
                            {tipData.tip}
                        </p>

                        {tipData.action && (
                            <Link
                                to={tipData.action}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    background: 'var(--primary-600)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    transition: 'background 0.2s'
                                }}
                            >
                                Take Action <ArrowRight size={16} weight="bold" />
                            </Link>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ padding: '0 16px 16px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--gray-500)' }}>
                            <span>Progress</span>
                            <span>{Math.round((progress.filter(p => p.status === 'completed').length / (milestones.length || 1)) * 100)}%</span>
                        </div>
                        <div style={{ height: '6px', width: '100%', background: 'var(--gray-100)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${(progress.filter(p => p.status === 'completed').length / (milestones.length || 1)) * 100}%`,
                                background: 'linear-gradient(90deg, var(--primary-500), var(--primary-400))',
                                borderRadius: '10px',
                                transition: 'width 0.5s ease-out'
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JourneyWidget;
