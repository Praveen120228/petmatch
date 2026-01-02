import React from 'react';
import { CircleNotch } from '@phosphor-icons/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    icon,
    className = '',
    disabled,
    style,
    ...props
}) => {

    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        gap: '0.5rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.7 : 1,
        width: fullWidth ? '100%' : 'auto',
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
        padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '1rem 2rem' : '0.75rem 1.5rem',
        position: 'relative',
        ...style,
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                    color: 'white',
                    border: '1px solid transparent',
                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
                };
            case 'secondary':
                return {
                    background: 'var(--primary-50)',
                    color: 'var(--primary-700)',
                    border: '1px solid transparent',
                };
            case 'outline':
                return {
                    background: 'transparent',
                    border: '1px solid var(--gray-200)',
                    color: 'var(--gray-700)',
                };
            case 'danger':
                return {
                    background: 'var(--error)',
                    color: 'white',
                    border: '1px solid transparent',
                    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: 'var(--gray-600)',
                    border: '1px solid transparent',
                };
            default:
                return {};
        }
    };

    const combinedStyles = {
        ...baseStyles,
        ...getVariantStyles(),
        // Allow overriding via style prop
        ...style
    };

    return (
        <button
            style={combinedStyles}
            className={`${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <CircleNotch weight="bold" className="animate-spin" size={size === 'lg' ? 24 : 18} style={{ animation: 'spin 1s linear infinite' }} />}
            {!loading && icon}
            {children}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                button:active:not(:disabled) { transform: scale(0.96); }
            `}</style>
        </button>
    );
};

export default Button;
