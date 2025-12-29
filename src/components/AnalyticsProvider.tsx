import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../lib/analyticsService';

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const lastScrollDepth = useRef(0);

    // 1. Initialize & Track Page Views
    useEffect(() => {
        analyticsService.init();
        analyticsService.trackPageView(location.pathname);
    }, [location]);

    // 2. Track Clicks (Bubbling)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Only track clicks on interesting elements
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                const element = target.closest('button') || target.closest('a') || target;
                const text = element.innerText || element.getAttribute('aria-label') || 'unknown';

                analyticsService.trackEvent('click', {
                    tag: element.tagName,
                    text: text.substring(0, 50),
                    path: location.pathname,
                    x: e.clientX,
                    y: e.clientY
                });
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [location.pathname]);

    // 3. Track Scroll Depth
    useEffect(() => {
        let throttleTimer: any;

        const handleScroll = () => {
            if (throttleTimer) return;

            throttleTimer = setTimeout(() => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollTop = window.scrollY;

                if (scrollHeight <= 0) return;

                const percent = Math.round((scrollTop / scrollHeight) * 100);

                // Log every 25% milestone
                if (percent > lastScrollDepth.current + 25) {
                    lastScrollDepth.current = percent;
                    analyticsService.trackEvent('scroll', { depth: percent, path: location.pathname });
                }

                throttleTimer = null;
            }, 1000);
        };

        window.addEventListener('scroll', handleScroll);

        // Reset on page change
        lastScrollDepth.current = 0;

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [location.pathname]);

    // 4. Heartbeat (Time spent)
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                analyticsService.trackEvent('heartbeat', { path: location.pathname });
            }
        }, 30000); // Every 30s

        return () => clearInterval(interval);
    }, [location.pathname]);

    return <>{children}</>;
};
