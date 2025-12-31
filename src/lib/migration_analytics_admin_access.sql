-- Allow Admins to view analytics
-- Depends on analytics_events table existing from migration_analytics.sql

-- 1. Drop the restrictive policy if it exists
DROP POLICY IF EXISTS "No one can view analytics via API." ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics." ON public.analytics_events;

-- 2. Create Admin View Policy
CREATE POLICY "Admins can view analytics." 
ON public.analytics_events 
FOR SELECT 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
);
