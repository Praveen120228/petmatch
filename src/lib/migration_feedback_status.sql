-- Add status and admin_notes columns to feedback table
alter table public.feedback 
add column if not exists status text default 'pending' check (status in ('pending', 'reviewed', 'archived')),
add column if not exists admin_notes text;

-- Policy to allow admins to update feedback (assuming admin role or similar mechanism)
-- If you use a 'role' column in profiles, RLS might need to check that.
-- For now, simplest is to assume service role access for admin panel, or add policy:
-- create policy "Admins can update feedback" on public.feedback for update using ( ... );
