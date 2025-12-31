import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from './Button';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    hasNext: boolean;
    hasPrev: boolean;
    loading?: boolean;
    totalItems?: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    hasNext,
    hasPrev,
    loading = false,
    totalItems
}) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Showing page <span style={{ fontWeight: 700, color: '#1e293b' }}>{currentPage}</span> of <span style={{ fontWeight: 700, color: '#1e293b' }}>{totalPages || 1}</span>
                {totalItems !== undefined && (
                    <span> ({totalItems} total results)</span>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrev || loading}
                    style={{ padding: '0.5rem 0.75rem' }}
                >
                    <CaretLeft weight="bold" /> Previous
                </Button>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {/* Simple logic: just show current page for now to avoid complexity with ellipsis */}
                    <button
                        style={{
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '6px',
                            border: '1px solid #3b82f6',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            cursor: 'default'
                        }}
                    >
                        {currentPage}
                    </button>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNext || loading}
                    style={{ padding: '0.5rem 0.75rem' }}
                >
                    Next <CaretRight weight="bold" />
                </Button>
            </div>
        </div>
    );
};

export default PaginationControls;
