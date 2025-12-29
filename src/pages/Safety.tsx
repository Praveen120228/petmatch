
import { ShieldCheck, Warning, CheckCircle } from '@phosphor-icons/react';
import Card from '../components/Card';

const Safety = () => {
    return (
        <>
            {/* Assuming a Head component or similar for SEO, not present in original but implied by description prop */}
            {/* <Head
                title="Safety Center - Specyf"
                description="Safety guidelines and tips for using Specyf. Learn how to protect yourself and your pet."
            /> */}

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: '#e8f5e9', borderRadius: '50%', color: '#4caf50', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={48} weight="fill" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Safety First</h1>
                    <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto' }}>
                        Your safety and your pet's well-being are our highest priorities. Here's how to stay safe on Specyf.
                    </p>
                </div>
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

        </>
    );
};

export default Safety;
