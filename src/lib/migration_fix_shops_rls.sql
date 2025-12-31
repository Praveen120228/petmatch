-- Allow Admins to UPDATE shops (Approve/Reject/Suspend)
CREATE POLICY "Admins can update all shops" ON shops
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Allow Admins to DELETE shops (Power Tools)
CREATE POLICY "Admins can delete all shops" ON shops
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Allow Admins to SELECT all shops (already implicitly covered if RLS is off or specific policies exist, but ensuring it)
-- Note: You might already have a select policy, but this ensures admins see everything including unapproved.
CREATE POLICY "Admins can view all shops" ON shops
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
