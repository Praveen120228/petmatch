import { PawPrint, Users, Heart } from '@phosphor-icons/react';
import Card from '../components/Card';

const About = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }} className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>About Specyf</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', lineHeight: '1.8' }}>
                    We're on a mission to connect every pet with a loving home.
                </p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '3rem' }}>
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#e3f2fd', borderRadius: '50%', color: '#2196f3' }}>
                            <PawPrint size={32} weight="fill" />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Our Story</h2>
                    </div>
                    <p style={{ fontSize: '1.125rem', color: 'var(--gray-700)', lineHeight: '1.7' }}>
                        Specyf was founded with a simple belief: pets are happier when they have friends. We provide a safe,
                        secure platform for pet owners to find playdates, adoption opportunities, and community support.
                        Whether you're looking for a new family member or a walking buddy for your furry friend,
                        Specyf helps you find the perfect match.
                    </p>
                </section>

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
