import { useEffect } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref or other events
 */
export const useEscapeKey = (onEscape: () => void) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onEscape();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onEscape]);
};
