import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

import { PawPrint, Heart, Chats, ShieldCheck, Star } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { celebrateSuccess } from '../utils/delight';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/match');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
            <SEO
                title="Find Your Perfect Pet Match"
                description="Specyf connects pets with loving homes. Discover dogs, cats, and other pets for adoption or playdates near you."
                canonicalUrl="https://specyf.in/"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Specyf",
                    "url": "https://specyf.in/",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "https://specyf.in/search?q={search_term_string}",
                        "query-input": "required name=search_term_string"
                    },
                    "description": "Specyf is a pet adoption and matching platform connecting pets with loving homes."
                }}
            />

            {/* Hero Section */}
            <section style={{
                minHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '4rem 2rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, rgba(255,255,255,0) 70%)'
            }} className="fade-in">

                {/* Moving Paws Background - Overlaying (Z-Index 0 for Landing, behind text but front of bg) */}
                {/* Actually user said "overlay them on to the cards" for auth. For Landing, text is hero. 
                    Let's keep them at z-index 0 so they don't block text selection, but visible. 
                    Or maybe z-index 10 if we want them to float over some text? 
                    Let's stick to z-Index 0 for background feel, but use the new classes. */}

                <div className="paw-print paw-left" style={{ left: '5%', animationDelay: '0s', fontSize: 'clamp(1.5rem, 4vw, 3rem)', opacity: 0.1 }}>🐾</div>
                <div className="paw-print paw-right" style={{ left: '85%', animationDelay: '5s', fontSize: 'clamp(1.2rem, 3vw, 2rem)', opacity: 0.1 }}>🐾</div>
                <div className="paw-print paw-left" style={{ left: '15%', animationDelay: '2s', fontSize: 'clamp(2rem, 5vw, 4rem)', opacity: 0.08 }}>🐾</div>
                <div className="paw-print" style={{ left: '50%', animationDelay: '8s', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', opacity: 0.05 }}>🐾</div>
                <div className="paw-print paw-right" style={{ left: '90%', animationDelay: '4s', fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)', opacity: 0.1 }}>🐾</div>
                <div className="paw-print paw-left" style={{ left: '8%', animationDelay: '12s', fontSize: 'clamp(1.2rem, 3vw, 2rem)', opacity: 0.1 }}>🐾</div>

                {/* Floating Elements (Drift) */}
                <div style={{ position: 'absolute', top: '10%', right: '10%', fontSize: 'clamp(2rem, 6vw, 4rem)', opacity: 0.2, animationDelay: '1s', zIndex: 0 }} className="animate-drift-slow float-item">🦴</div>
                <div style={{ position: 'absolute', bottom: '10%', left: '10%', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', opacity: 0.2, animationDelay: '2s', zIndex: 0 }} className="animate-drift-reverse float-item">🎾</div>
                <div style={{ position: 'absolute', top: '25%', left: '5%', fontSize: 'clamp(1.8rem, 5vw, 3rem)', opacity: 0.15, zIndex: 0 }} className="animate-drift float-item">🐕</div>
                <div style={{ position: 'absolute', bottom: '25%', right: '5%', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', opacity: 0.15, animationDelay: '3s', zIndex: 0 }} className="animate-drift-slow float-item">🐈</div>

                {/* Badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '2rem',
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--primary-200)',
                    boxShadow: 'var(--shadow-md)'
                }} className="pulse-animation">
                    <span style={{ fontSize: '1.25rem' }}>✨</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-700)' }}>#1 Community for Pets</span>
                </div>

                {/* Headline */}
                <h1 style={{
                    fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                    fontWeight: 900,
                    lineHeight: 1.1,
                    marginBottom: '2rem',
                    letterSpacing: '-0.03em',
                    maxWidth: '1000px',
                    // Color handled by global CSS h1 gradient
                }}>
                    Give your pet the <br />
                    <span className="text-gradient">social life</span> they deserve.
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--gray-600)',
                    marginBottom: '3rem',
                    maxWidth: '640px',
                    lineHeight: 1.6
                }}>
                    Connect with local pet owners, arrange playdates, and find lifelong companionship for your furry friend in a safe, verified community.
                </p>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/signup">
                        <Button
                            size="lg"
                            variant="primary"
                            icon={<PawPrint weight="fill" />}
                            style={{ padding: '1.125rem 2.5rem', fontSize: '1.125rem', boxShadow: 'var(--shadow-colored)' }}
                            onClick={() => celebrateSuccess()}
                        >
                            Get Started
                        </Button>
                    </Link>
                    <Link to="/login">
                        <Button size="lg" variant="outline" style={{ padding: '1.125rem 2.5rem', fontSize: '1.125rem', background: 'rgba(255,255,255,0.8)' }}>
                            Log In
                        </Button>
                    </Link>
                </div>

                {/* Social Proof */}
                <div style={{ marginTop: '4rem', display: 'flex', alignItems: 'center', gap: '2rem', color: 'var(--gray-500)' }}>
                    <div style={{ display: 'flex', gap: '4px', color: 'var(--warning)' }}>
                        <Star weight="fill" size={20} />
                        <Star weight="fill" size={20} />
                        <Star weight="fill" size={20} />
                        <Star weight="fill" size={20} />
                        <Star weight="fill" size={20} />
                    </div>
                    <span style={{ fontWeight: 500 }}>Trusted by 10,000+ happy pets</span>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem 8rem' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Why Specyf?</h2>
                <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '1.125rem', marginBottom: '5rem', maxWidth: '600px', margin: '0 auto 5rem' }}>We've built a platform specifically designed for the unique needs of pets and their owners.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                    {[
                        {
                            icon: <Heart size={40} weight="duotone" color="var(--secondary-500)" />,
                            title: 'Smart Matching',
                            desc: 'Our algorithm finds pets with compatible personalities, breeds, and energy levels to ensure safe playdates.'
                        },
                        {
                            icon: <Chats size={40} weight="duotone" color="var(--primary-500)" />,
                            title: 'Instant Chat',
                            desc: 'Connect securely with other owners. Share photos, schedule meetups, and get to know each other before meeting.'
                        },
                        {
                            icon: <ShieldCheck size={40} weight="duotone" color="var(--success)" />,
                            title: 'Verified Profiles',
                            desc: 'Safety is our top priority. Every profile is verified to ensure a trustworthy community for you and your pet.'
                        }
                    ].map((feature, i) => (
                        <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <div style={{ marginBottom: '1rem' }}>{feature.icon}</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--gray-600)' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                marginTop: 'auto',
                padding: '2rem',
                borderTop: '1px solid var(--gray-200)',
                background: 'white',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <PawPrint size={24} weight="fill" color="var(--primary)" />
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)' }}>Specyf</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                    {['About', 'Safety', 'Guidelines', 'Support'].map(link => (
                        <Link key={link} to={`/${link.toLowerCase()}`} style={{ color: 'var(--gray-600)', textDecoration: 'none' }}>{link}</Link>
                    ))}
                </div>
                <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} Specyf. All rights reserved.</p>
            </footer>

            <style>{`
                @media (max-width: 768px) {
                    .paw-left { left: 5% !important; }
                    .paw-right { left: 88% !important; }
                    .float-item { opacity: 0.3 !important; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
