import { Link } from 'react-router-dom';
import { Storefront, CheckCircle, ChartLineUp, CalendarCheck, Sparkle } from '@phosphor-icons/react';
import Button from '../../components/Button';

const ShopLanding = () => {
    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero Section */}
            <section style={{
                padding: '8rem 1.5rem 6rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }} className="fade-in">

                {/* Floating Elements (Background) */}
                <div style={{ position: 'absolute', top: '20%', left: '10%', opacity: 0.6, animation: 'float-animation 6s ease-in-out infinite' }}>
                    <Storefront size={48} weight="duotone" color="var(--primary-400)" />
                </div>
                <div style={{ position: 'absolute', top: '15%', right: '15%', opacity: 0.6, animation: 'float-animation 7s ease-in-out infinite', animationDelay: '1s' }}>
                    <ChartLineUp size={48} weight="duotone" color="var(--secondary-400)" />
                </div>
                <div style={{ position: 'absolute', bottom: '20%', left: '15%', opacity: 0.4, animation: 'float-animation 8s ease-in-out infinite', animationDelay: '0.5s' }}>
                    <CalendarCheck size={40} weight="duotone" color="var(--primary-300)" />
                </div>

                <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1.25rem',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--primary-700)',
                        border: '1px solid var(--primary-200)',
                        borderRadius: '999px',
                        marginBottom: '1.5rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.1)'
                    }}>
                        <Sparkle size={16} weight="fill" />
                        For Pet Professionals
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(3rem, 6vw, 5rem)',
                        fontWeight: 900,
                        color: 'var(--gray-900)',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em'
                    }}>
                        Grow your business with <span className="text-gradient">Specyf</span>
                    </h1>

                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--gray-600)',
                        marginBottom: '3rem',
                        lineHeight: 1.6,
                        maxWidth: '700px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Get discovered by thousands of pet owners, manage bookings effortlessly, and maximize your revenue. The all-in-one platform for Groomers, Vets, and Trainers.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/shop/register">
                            <Button size="lg" variant="primary">
                                Register Your Shop
                            </Button>
                        </Link>
                        <Link to="/shop/login">
                            <Button size="lg" variant="outline" style={{ background: 'rgba(255,255,255,0.5)' }}>
                                Shop Owner Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '2rem 1.5rem 6rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            {
                                icon: <CheckCircle size={32} weight="duotone" color="var(--primary-600)" />,
                                title: "Get more Bookings",
                                desc: "Showcase your services to pet owners actively looking for them in your area."
                            },
                            {
                                icon: <CalendarCheck size={32} weight="duotone" color="var(--primary-600)" />,
                                title: "Smart Scheduling",
                                desc: "Set your own hours and let clients book available slots automatically."
                            },
                            {
                                icon: <ChartLineUp size={32} weight="duotone" color="var(--primary-600)" />,
                                title: "Grow Revenue",
                                desc: "Reduce no-shows and fill empty slots with our optimized booking flow."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="glass-panel card-hover" style={{
                                padding: '2.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{
                                    marginBottom: '1.5rem',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    background: 'var(--primary-50)'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                                    {feature.title}
                                </h3>
                                <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ShopLanding;
