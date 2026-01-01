-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    type text NOT NULL CHECK (type IN ('report', 'milestone_user', 'milestone_shop', 'system')),
    message text NOT NULL,
    link text, -- Route to navigate to (e.g., /admin/reports)
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. RLS Policies
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only Admins can view/update notifications
CREATE POLICY "Admins can view notifications" 
ON public.admin_notifications FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update notifications" 
ON public.admin_notifications FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow system level inserts (triggers run as superuser/owner usually, but good to be explicit if needed, though triggers bypass RLS if security definer)

-- 3. Trigger Function: New Report
CREATE OR REPLACE FUNCTION public.handle_new_report_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, message, link)
    VALUES (
        'report',
        'New ' || NEW.reason || ' report submitted.',
        '/admin/reports'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_report ON public.reports;
CREATE TRIGGER on_new_report
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.handle_new_report_notification();


-- 4. Trigger Function: User Milestone (Every 100)
CREATE OR REPLACE FUNCTION public.handle_user_milestone_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_count integer;
BEGIN
    SELECT count(*) INTO user_count FROM public.profiles;
    
    -- Check if multiple of 100
    IF user_count > 0 AND (user_count % 100 = 0) THEN
        INSERT INTO public.admin_notifications (type, message, link)
        VALUES (
            'milestone_user',
            'Milestone Reached: ' || user_count || ' Registered Users! 🎉',
            '/admin/users'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_milestone ON public.profiles;
CREATE TRIGGER on_new_user_milestone
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_user_milestone_notification();


-- 5. Trigger Function: Shop Milestone (Every 10)
CREATE OR REPLACE FUNCTION public.handle_shop_milestone_notification()
RETURNS TRIGGER AS $$
DECLARE
    shop_count integer;
BEGIN
    SELECT count(*) INTO shop_count FROM public.shops;
    
    -- Check if multiple of 10
    IF shop_count > 0 AND (shop_count % 10 = 0) THEN
        INSERT INTO public.admin_notifications (type, message, link)
        VALUES (
            'milestone_shop',
            'Milestone Reached: ' || shop_count || ' Shops Registered! 🏪',
            '/admin/shops'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_shop_milestone ON public.shops;
CREATE TRIGGER on_new_shop_milestone
AFTER INSERT ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.handle_shop_milestone_notification();

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
