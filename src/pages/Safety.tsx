import { ShieldCheck, Warning, CheckCircle } from '@phosphor-icons/react';
import Card from '../components/Card';

const Safety = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }} className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Safety Center</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                    Your safety and your pet's well-being are our highest priorities. Here's how to stay safe on PetMatch.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <Card padding="xl" style={{ borderLeft: '4px solid var(--success)' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={32} color="var(--success)" weight="duotone" />
                        Meeting for the First Time
                    </h2>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            "Meet in a public place like a park or dog run.",
                            "Keep the first meeting short to see how the pets get along.",
                            "Ideally, bring a friend or family member with you.",
                            "Keep dogs on leashes until you are sure they are comfortable."
                        ].map((tip, i) => (
                            <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'start', color: 'var(--gray-700)' }}>
                                <CheckCircle size={20} color="var(--success)" weight="fill" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card padding="xl" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Warning size={32} color="var(--warning)" weight="duotone" />
                        Red Flags
                    </h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
                        Trust your instincts. If something feels off, it probably is. Watch out for:
                    </p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            "Users who ask for financial information or money.",
                            "Pressure to meet in private or secluded areas immediately.",
                            "Inconsistent information about their pet.",
                            "Aggressive behavior from the owner or the pet."
                        ].map((tip, i) => (
                            <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'start', color: 'var(--gray-700)' }}>
                                <Warning size={20} color="var(--warning)" weight="fill" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default Safety;
