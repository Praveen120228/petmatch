import { PawPrint, Users, Heart } from '@phosphor-icons/react';
import Card from '../components/Card';

const About = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }} className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>About Specyf</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                    We're on a mission to connect pets and their people, creating a world where every pet has a best friend.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '2rem', marginBottom: '4rem' }}>
                <Card padding="xl">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <PawPrint size={32} color="var(--primary-600)" weight="duotone" />
                        Our Mission
                    </h2>
                    <p style={{ color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        Specyf was founded with a simple belief: pets are happier when they have friends. We provide a safe,
                        verified platform for pet owners to connect, arrange playdates, and build a local community.
                        Whether you have a high-energy dog who needs a running buddy or a shy cat looking for a quiet companion,
                        Specyf helps you find the perfect match.
                    </p>
                </Card>

                <Card padding="xl">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Users size={32} color="var(--secondary-500)" weight="duotone" />
                        Community First
                    </h2>
                    <p style={{ color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        We believe in the power of community. By connecting local pet owners, we're not just arranging playdates;
                        we're building support networks. Need a recommendation for a vet? Someone to walk your dog?
                        Or just someone who understands the joys (and challenges) of pet parenthood? You'll find them here.
                    </p>
                </Card>

                <Card padding="xl">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Heart size={32} color="var(--error)" weight="duotone" />
                        Safety & Trust
                    </h2>
                    <p style={{ color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        Your pet's safety is our top priority. That's why we have a rigorous verification process for all members.
                        We provide tools like secure messaging and profile reviews so you can feel confident before you meet.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default About;
