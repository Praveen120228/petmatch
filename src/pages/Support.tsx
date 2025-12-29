import Button from '../components/Button';

import SEO from '../components/SEO';

const Support = () => {
    return (
        <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '4rem', background: 'var(--gray-50)' }}>
            <SEO
                title="Support"
                description="Get help and support for Specyf. Find answers to common questions about pet matching and adoption."
            />

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>How can we help?</h1>
                    <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)' }}>
                        Find answers to frequently asked questions or get in touch with our team.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {[
                        { q: "Is Specyf free to use?", a: "Yes! Creating a profile and matching with other pets is completely free." },
                        { q: "How do I report a user?", a: "Go to the user's profile, click the three dots menu, and select 'Report User'." },
                        { q: "Can I adopt pets here?", a: "Yes, many shelters and individuals list pets for adoption. Look for the 'Adoption' tag." },
                        { q: "Is my data safe?", a: "We use industry-standard encryption to protect your personal information." }
                    ].map((faq, i) => (
                        <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{faq.q}</h3>
                            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem', background: 'white', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Still need help?</h2>
                    <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>Our team is available Monday through Friday, 9am - 5pm EST.</p>
                    <Button variant="primary" size="lg" onClick={() => window.location.href = 'mailto:support@specyf.online'}>
                        Contact Support
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Support;
