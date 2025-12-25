import { Envelope, Question } from '@phosphor-icons/react';
import Card from '../components/Card';
import Button from '../components/Button';

const Support = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }} className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Help & Support</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                    Have a question? We're here to help.
                </p>
            </div>

            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ marginBottom: '2rem' }}>Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { q: "Is Specyf free to use?", a: "Yes! Creating a profile and matching with other pets is completely free." },
                        { q: "How do I verify my account?", a: "Go to your profile settings and upload a photo of you with your pet. Our team will review it within 24 hours." },
                        { q: "Can I delete my account?", a: "Yes, you can permanently delete your account and data from the Settings page." },
                        { q: "What if I have a bad experience?", a: "Please report any negative experiences immediately through the user's profile or our contact form." }
                    ].map((item, i) => (
                        <Card key={i} padding="lg">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Question size={20} color="var(--primary-500)" weight="bold" />
                                {item.q}
                            </h3>
                            <p style={{ color: 'var(--gray-600)', paddingLeft: '1.75rem' }}>{item.a}</p>
                        </Card>
                    ))}
                </div>
            </div>

            <Card padding="xl" style={{ textAlign: 'center', background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
                <Envelope size={48} color="var(--primary-600)" weight="duotone" style={{ marginBottom: '1rem' }} />
                <h2 style={{ marginBottom: '1rem' }}>Still need help?</h2>
                <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>Our support team is available Mon-Fri, 9am - 5pm EST.</p>
                <Button variant="primary" size="lg" onClick={() => window.location.href = 'mailto:support@specyf.online'}>
                    Contact Support
                </Button>
            </Card>
        </div>
    );
};

export default Support;
