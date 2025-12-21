import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    fullWidth = false,
    style,
    className,
    ...props
}) => {
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '1rem',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        marginLeft: '0.25rem',
    };

    const inputStyle: React.CSSProperties = {
        padding: '0.875rem 1rem', // Larger touch target
        borderRadius: 'var(--radius-md)',
        border: error ? '1px solid red' : '1px solid #e5e7eb',
        background: '#ffffff',
        color: 'var(--color-text-primary)',
        fontSize: '16px', // Prevent iOS zoom
        outline: 'none',
        transition: 'border-color 0.2s',
        width: '100%',
        minHeight: '48px', // Minimum touch target size
    };

    return (
        <div style={containerStyle} className={className}>
            {label && <label style={labelStyle}>{label}</label>}
            <input
                style={inputStyle}
                onFocus={(e) => {
                    if (!error) e.currentTarget.style.borderColor = 'var(--color-secondary)';
                }}
                onBlur={(e) => {
                    if (!error) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                {...props}
            />
            {error && <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>{error}</span>}
        </div>
    );
};

export default Input;
