import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import Card from '../components/Card';
import SEO from '../components/SEO';

const Guidelines = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }} className="fade-in">
            <SEO
                title="Community Guidelines"
                description="Read our community guidelines to ensure a safe and respectful environment for all pets and owners."
            />
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Community Guidelines</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                    To enhance the Specyf experience, we ask all members to follow these simple guidelines.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                <Card padding="xl">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary-700)' }}>
                        <ThumbsUp size={32} weight="duotone" />
                        Do's
                    </h2>
                    <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--gray-700)' }}>
                        <li><strong>Be Respectful:</strong> Treat everyone with kindness and courtesy.</li>
                        <li><strong>Be Honest:</strong> Provide accurate information about your pet's behavior and temperament.</li>
                        <li><strong>Clean Up:</strong> Always pick up after your pet during meetups.</li>
                        <li><strong>Communicate:</strong> Keep lines of communication open if plans change.</li>
                    </ul>
                </Card>

                <Card padding="xl">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--secondary-600)' }}>
                        <ThumbsDown size={32} weight="duotone" />
                        Don'ts
                    </h2>
                    <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--gray-700)' }}>
                        <li><strong>Harassment:</strong> Any form of bullying or harassment will result in an immediate ban.</li>
                        <li><strong>Spam:</strong> Do not use the platform to promote unrelated businesses or services.</li>
                        <li><strong>Unsafe Pets:</strong> Do not bring known aggressive pets to playdates with incompatible animals.</li>
                        <li><strong>Impersonation:</strong> Do not create fake profiles.</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default Guidelines;
