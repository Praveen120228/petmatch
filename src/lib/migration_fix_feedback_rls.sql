-- Fix RLS for Feedback table to allow Admins full access

-- 1. Drop existing restrictive policies if necessary (or just add new permissive ones for admins)
-- It's safer to be explicit.

-- Policy for Admins to View All
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy for Admins to Update All (e.g. mark as reviewed)
CREATE POLICY "Admins can update feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy for Admins to Delete Feedback
CREATE POLICY "Admins can delete feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
