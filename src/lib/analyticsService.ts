import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export type EventType = 'page_view' | 'click' | 'scroll' | 'session_start' | 'heartbeat';

export interface AnalyticsEvent {
    id?: number;
    user_id?: string;
    session_id: string;
    event_type: EventType;
    payload: any;
    created_at?: string;
}

const SESSION_KEY = 'petmatch_session_id';

export const analyticsService = {
    sessionId: '',

    init() {
        // Recover or create session ID
        let sid = localStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = uuidv4();
            localStorage.setItem(SESSION_KEY, sid!);
            // Track new session start
            this.trackEvent('session_start', { referer: document.referrer });
        }
        this.sessionId = sid!;
    },

    async trackEvent(eventType: EventType, payload: any = {}) {
        if (!this.sessionId) this.init();

        try {
            const { data: { user } } = await supabase.auth.getUser();

            await supabase.from('analytics_events').insert({
                session_id: this.sessionId,
                user_id: user?.id || null,
                event_type: eventType,
                payload
            });
        } catch (error) {
            console.error('Analytics Error:', error);
            // Non-blocking, fail silently
        }
    },

    trackPageView(path: string) {
        this.trackEvent('page_view', { path });
    }
};
