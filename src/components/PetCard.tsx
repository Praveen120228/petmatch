import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin } from '@phosphor-icons/react';
import Card from './Card';
import { getDistance } from '../utils/distance';

interface PetCardProps {
    pet: any;
    userLoc: { lat: number, lng: number } | null;
    isLiked: boolean;
    onLike: (e: React.MouseEvent) => void;
    hoveredId: string | null;
    setHoveredId: (id: string | null) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, userLoc, isLiked, onLike, hoveredId, setHoveredId }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isHovered = hoveredId === pet.id;

    return (
        <div
            onMouseEnter={() => setHoveredId(pet.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
                height: '340px', // Slightly taller for better proportion
                width: '100%',
                position: 'relative'
            }}
        >
            <Card
                padding="0"
                style={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: isHovered ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring-like transition
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                    overflow: 'hidden',
                    background: 'var(--gray-900)',
                    height: '100%',
                    position: 'relative',
                    display: 'block'
                }}
            >
                <Link to={`/pet/${pet.id}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
                    <div style={{ position: 'relative', height: '100%' }}>

                        {/* Image Loader / Skeleton Background */}
                        {!imageLoaded && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%)',
                                backgroundSize: '200% 100%',
                                animation: 'shine 1.5s linear infinite',
                                zIndex: 1
                            }} />
                        )}

                        <img
                            src={pet.image || pet.images?.[0] || 'https://placehold.co/600x800/f3f4f6/9ca3af?text=No+Image'}
                            alt={pet.name}
                            onLoad={() => setImageLoaded(true)}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.7s ease, opacity 0.5s ease',
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)', // Zoom effect on hover
                                opacity: imageLoaded ? 1 : 0
                            }}
                        />

                        {/* Gradient Overlay */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '70%', // Taller gradient for better text readability
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                            pointerEvents: 'none'
                        }} />

                        {/* Content */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '1.5rem',
                            color: 'white',
                            zIndex: 2
                        }}>
                            {/* Name & Age */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                    {pet.name},
                                </h3>
                                <span style={{ fontSize: '1.25rem', fontWeight: 400, opacity: 0.9 }}>{pet.age}</span>
                            </div>

                            {/* Location & Bread */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                marginBottom: '0.75rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                                    <MapPin size={16} weight="fill" color="#f43f5e" />
                                    {userLoc && pet.latitude && pet.longitude ? (
                                        <span>{getDistance(userLoc.lat, userLoc.lng, Number(pet.latitude), Number(pet.longitude))} away</span>
                                    ) : (
                                        <span>{pet.location}</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8, paddingLeft: '2px' }}>
                                    {pet.breed}
                                </div>
                            </div>

                            {/* Bio (Auto-hide on shorter cards, clamp on others) */}
                            <p style={{
                                fontSize: '0.875rem',
                                lineHeight: 1.5,
                                color: 'rgba(255,255,255,0.8)',
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: '90%' // Prevent text from hitting the like button area if it was lower
                            }}>
                                {pet.bio}
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Like Button */}
                <button
                    onClick={onLike}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(255, 255, 255, 0.15)', // Glassy
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: isLiked ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = isLiked ? 'scale(1.1)' : 'scale(1)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                >
                    <Heart
                        size={26}
                        weight={isLiked ? "fill" : "bold"}
                        color={isLiked ? "#f43f5e" : "white"}
                        style={{
                            filter: isLiked ? 'drop-shadow(0 2px 8px rgba(244, 63, 94, 0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            transition: 'all 0.3s ease'
                        }}
                    />
                </button>
            </Card>
        </div>
    );
};

export default PetCard;
