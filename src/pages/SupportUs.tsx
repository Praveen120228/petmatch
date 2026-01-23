import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Coins, Users, Rocket, CaretLeft, CheckCircle, Sparkle, ShieldCheck } from '@phosphor-icons/react';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { celebrateSuccess } from '../utils/delight';

const SupportUs = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState<number | string>(25);
    const [isSuccess, setIsSuccess] = useState(false);

    const donationOptions = [
        { value: 10, label: '$10', desc: 'Treats for a pup' },
        { value: 25, label: '$25', desc: 'Server Maintenance' },
        { value: 50, label: '$50', desc: 'Community Growth' },
        { value: 'custom', label: 'Custom', desc: 'Every bit helps' }
    ];

    const handleSupport = () => {
        if (typeof (window as any).Razorpay === 'undefined') {
            alert('Razorpay SDK failed to load. Please check your connection.');
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Use env var or placeholder
            amount: Number(amount) * 100, // Amount in paise
            currency: 'INR',
            name: 'Specyf',
            description: 'Support Pet Community Development',
            image: '/logo.svg',
            handler: function (response: any) {
                console.log('Payment Success:', response.razorpay_payment_id);
                setIsSuccess(true);
                celebrateSuccess();
            },
            prefill: {
                name: '',
                email: '',
                contact: ''
            },
            notes: {
                address: 'Specyf Community Support'
            },
            theme: {
                color: '#8b5cf6' // matches var(--primary-500)
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
            alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();
    };

    if (isSuccess) {
        return (
            <div className="fade-in" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gray-50)',
                padding: '2rem'
            }}>
                <div style={{
                    maxWidth: '400px',
                    textAlign: 'center',
                    background: 'white',
                    padding: '3rem 2rem',
                    borderRadius: '32px',
                    boxShadow: 'var(--shadow-xl)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--success-50)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--success-600)'
                    }}>
                        <CheckCircle size={48} weight="fill" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Huge Thanks! 🐾</h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Your support of <strong>${amount}</strong> directly helps us build a safer and better community for pets everywhere.
                    </p>
                    <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/')}>
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--gray-50)', paddingTop: '80px', paddingBottom: '4rem' }}>
            <SEO
                title="Support Our Mission"
                description="Help us build the #1 community for pets. Your contributions support development and maintenance of Specyf."
            />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'none',
                        color: 'var(--gray-500)',
                        cursor: 'pointer',
                        padding: '0.5rem 0',
                        marginBottom: '2rem',
                        fontWeight: 600
                    }}
                >
                    <CaretLeft size={20} />
                    Back
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'start' }}>

                    {/* Story Side */}
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--primary-50)',
                            color: 'var(--primary-700)',
                            padding: '0.5rem 1rem',
                            borderRadius: '99px',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            marginBottom: '1.5rem'
                        }}>
                            <Sparkle weight="fill" />
                            SUPPORT OUR MISSION
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-0.02em' }}>
                            Building the world's <br />
                            <span className="text-gradient">kindest pet</span> community.
                        </h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                            Specyf started with a simple idea: every pet deserves a best friend.
                            As we grow, we need your help to keep the servers running, develop new features, and ensure the community remains safe and verified.
                        </p>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {[
                                { icon: <Rocket weight="duotone" />, title: 'Faster Development', desc: 'Deploy new features like AI pet matching and community meetups.' },
                                { icon: <ShieldCheck weight="duotone" />, title: 'Verified Security', desc: 'Maintain robust verification systems to keep our community safe.' },
                                { icon: <Users weight="duotone" />, title: 'Growing the Community', desc: 'Reach more pet owners and shelters to help more pets find homes.' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                    <div style={{
                                        color: 'var(--primary-600)',
                                        background: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        fontSize: '1.5rem'
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{item.title}</h4>
                                        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Donation Portal Side */}
                    <div style={{
                        background: 'white',
                        padding: '2.5rem',
                        borderRadius: '32px',
                        boxShadow: 'var(--shadow-xl)',
                        position: 'sticky',
                        top: '100px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--secondary-50)', color: 'var(--secondary-600)', padding: '0.5rem', borderRadius: '12px' }}>
                                <Heart weight="fill" size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Support Development</h3>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '1rem' }}>Select Amount</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                {donationOptions.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setAmount(opt.value === 'custom' ? '' : opt.value)}
                                        style={{
                                            padding: '1.25rem 1rem',
                                            borderRadius: '16px',
                                            border: '2px solid',
                                            borderColor: (typeof amount === 'number' && amount === opt.value) || (opt.value === 'custom' && typeof amount === 'string') ? 'var(--primary-500)' : 'var(--gray-100)',
                                            background: (typeof amount === 'number' && amount === opt.value) || (opt.value === 'custom' && typeof amount === 'string') ? 'var(--primary-50)' : 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: (typeof amount === 'number' && amount === opt.value) || (opt.value === 'custom' && typeof amount === 'string') ? 'var(--primary-700)' : 'var(--gray-900)' }}>
                                            {opt.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{opt.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {typeof amount === 'string' && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <input
                                        type="number"
                                        placeholder="Enter custom amount"
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--gray-200)',
                                            fontSize: '1rem',
                                            outlineColor: 'var(--primary-500)'
                                        }}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--gray-500)' }}>Total Contribution</span>
                                <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>${amount || 0}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', lineHeight: 1.4 }}>
                                * This is a contribution to support the community development. Funds are used for infrastructure and maintenance.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            icon={<Coins weight="fill" />}
                            onClick={handleSupport}
                            disabled={!amount}
                            style={{ borderRadius: '16px', height: '60px', fontSize: '1.1rem', fontWeight: 800 }}
                        >
                            Wire Funds to Specyf
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                                🔒 Secure Mock Payment Portal
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .text-gradient {
                    background: linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-500) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
};

export default SupportUs;
