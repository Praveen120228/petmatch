import { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

export interface SelectOption {
    label: string;
    value: string | number;
}

interface SelectProps {
    label?: string;
    value: string | number;
    onChange: (value: any) => void;
    options: (SelectOption | string | number)[];
    placeholder?: string;
    fullWidth?: boolean;
    disabled?: boolean;
}

const Select = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Select...",
    fullWidth = false,
    disabled = false
}: SelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Normalize options to objects
    const normalizedOptions: SelectOption[] = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) return opt as SelectOption;
        return { label: String(opt), value: opt };
    });

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: fullWidth ? '100%' : 'auto', marginBottom: '1rem' }}>
            {label && (
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: '0.25rem' }}>
                    {label}
                </label>
            )}
            <div ref={wrapperRef} style={{ position: 'relative' }}>
                {/* Trigger Button */}
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    style={{
                        padding: '0.875rem 1rem', // Match Input.tsx
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isOpen ? 'var(--primary-600)' : '#e5e7eb'}`,
                        background: disabled ? '#f3f4f6' : '#ffffff',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        boxShadow: isOpen ? '0 0 0 2px var(--primary-100)' : 'none',
                        color: selectedOption ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        minHeight: '48px' // Match Input.tsx
                    }}
                >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <CaretDown size={16} weight="bold" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--color-text-secondary)' }} />
                </div>

                {/* Dropdown Menu */}
                {isOpen && !disabled && (
                    <div style={{
                        position: 'absolute',
                        top: '120%',
                        left: 0,
                        right: 0,
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // var(--shadow-xl) approximation
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        animation: 'fadeIn 0.1s ease-out',
                        maxHeight: '250px',
                        overflowY: 'auto'
                    }}>
                        {normalizedOptions.map(opt => (
                            <div
                                key={String(opt.value)}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    color: value === opt.value ? 'var(--primary-600)' : 'var(--color-text-primary)',
                                    background: value === opt.value ? 'var(--primary-50)' : 'transparent',
                                    fontSize: '0.95rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== opt.value) e.currentTarget.style.background = 'var(--color-bg-subtle)';
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {opt.label}
                                {value === opt.value && <Check weight="bold" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Select;
