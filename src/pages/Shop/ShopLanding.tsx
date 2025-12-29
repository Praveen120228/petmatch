import { Link } from 'react-router-dom';
import { Storefront, CheckCircle, ChartLineUp, CalendarCheck } from '@phosphor-icons/react';

import Button from '../../components/Button';

const ShopLanding = () => {
    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>


            {/* Hero Section */}
            <section style={{
                padding: '6rem 1.5rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 50%, var(--primary-50) 0%, rgba(255,255,255,0) 70%)'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--white)',
                        color: 'var(--primary-700)',
                        border: '1px solid var(--primary-200)',
                        borderRadius: '999px',
                        marginBottom: '1.5rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <Storefront size={18} weight="fill" />
                        For Pet Businesses
                    </div>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: 800,
                        color: 'var(--gray-900)',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1
                    }}>
                        Grow your pet business with <span className="text-gradient">Specyf</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#4b5563',
                        marginBottom: '2.5rem',
                        lineHeight: 1.6
                    }}>
                        Get discovered by thousands of pet owners, manage bookings effortlessly, and grow your revenue. The all-in-one platform for Groomers, Vets, and Trainers.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <Link to="/shop/register">
                            <Button size="lg" variant="primary">
                                Register Your Shop
                            </Button>
                        </Link>
                        <Link to="/shop/login">
                            <Button size="lg" variant="outline">
                                Shop Owner Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '4rem 1.5rem', background: '#fff' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                            <div key={i} style={{
                                padding: '2rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '1rem',
                                background: '#f9fafb'
                            }}>
                                <div style={{ marginBottom: '1rem' }}>{feature.icon}</div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                                    {feature.title}
                                </h3>
                                <p style={{ color: '#6b7280', lineHeight: 1.5 }}>
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
