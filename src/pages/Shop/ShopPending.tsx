import { ArrowClockwise, Storefront } from "@phosphor-icons/react";
import Button from "../../components/Button";

const ShopPending = ({ onRefresh }: { onRefresh: () => void }) => {
    return (
        <div className="fade-in" style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: '#fff7ed',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '2rem',
                border: '1px solid #ffedd5'
            }}>
                <Storefront size={64} weight="duotone" color="#ea580c" />
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
                Your Shop is Under Review
            </h1>

            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '2rem', lineHeight: 1.6 }}>
                Thanks for setting up your business profile! Our team is currently reviewing your details to ensure the quality and safety of our platform.
            </p>

            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                maxWidth: '400px',
                width: '100%',
                marginBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>What happens next?</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    Most reviews are completed within 24 hours. You'll receive a notification once your shop is approved and live.
                </p>
            </div>

            <Button variant="outline" onClick={onRefresh}>
                <ArrowClockwise style={{ marginRight: '0.5rem' }} /> Check Status
            </Button>
        </div>
    );
};

export default ShopPending;
