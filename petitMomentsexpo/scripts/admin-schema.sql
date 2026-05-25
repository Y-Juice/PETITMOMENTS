-- Admin dashboard: rollen + policies voor meldingenbeheer
-- Voer uit in Supabase SQL Editor (na moderation-schema.sql).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Maak minstens één admin (pas e-mail aan):
-- UPDATE profiles SET is_admin = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'jouw@email.com');

DROP POLICY IF EXISTS "Admins can read all reports" ON content_reports;
CREATE POLICY "Admins can read all reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
CREATE POLICY "Admins can update reports"
  ON content_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update moments moderation" ON moments;
CREATE POLICY "Admins can update moments moderation"
  ON moments FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update threads moderation" ON threads;
CREATE POLICY "Admins can update threads moderation"
  ON threads FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can read profiles" ON profiles;
CREATE POLICY "Admins can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_user() OR auth.uid() = id);
