DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users; CREATE POLICY "Admins can read admin_users" ON admin_users FOR SELECT USING ("userId" = auth.uid()::text);
