import Card from './Card';

const PetCardSkeleton = () => {
    return (
        <div style={{ height: '320px', width: '240px', margin: '0 auto' }}>
            <Card
                padding="0"
                style={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    background: 'var(--gray-900)',
                    height: '100%',
                    position: 'relative',
                    display: 'block'
                }}
            >
                {/* Image Placeholder */}
                <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>

                {/* Top Left: Distance Badge Skeleton */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    width: '60px',
                    height: '24px',
                    borderRadius: '20px',
                    zIndex: 10
                }} className="skeleton-pulse" />

                {/* Top Right: Like Button Skeleton */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    zIndex: 10
                }} className="skeleton-pulse" />

                {/* Bottom Info Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    right: '24px',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    {/* Owner Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%' }} className="skeleton-pulse" />
                        <div style={{ width: '80px', height: '12px', borderRadius: '4px' }} className="skeleton-pulse" />
                    </div>

                    {/* Pet Name */}
                    <div style={{ width: '120px', height: '24px', borderRadius: '4px', marginBottom: '8px' }} className="skeleton-pulse" />

                    {/* Pet Details */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '40px', height: '16px', borderRadius: '4px' }} className="skeleton-pulse" />
                        <div style={{ width: '40px', height: '16px', borderRadius: '4px' }} className="skeleton-pulse" />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PetCardSkeleton;
