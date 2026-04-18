-- Rewrite RLS policies: role-based access (admin=full, artist=own record only)
-- Replaces insecure using(true) with check(true) policies from 20260411000300_rls.sql

-- ═══════════════════════════════════════════
-- DROP ALL EXISTING PERMISSIVE POLICIES
-- ═══════════════════════════════════════════

-- Artists policies
DROP POLICY IF EXISTS "anon_select_approved" ON public.artists;
DROP POLICY IF EXISTS "anon_insert_pending" ON public.artists;
DROP POLICY IF EXISTS "admin_artists_full" ON public.artists;

-- Invitations policies
DROP POLICY IF EXISTS "anon_select_invitation" ON public.invitations;
DROP POLICY IF EXISTS "anon_update_used" ON public.invitations;
DROP POLICY IF EXISTS "admin_invitations_full" ON public.invitations;

-- ═══════════════════════════════════════════
-- ARTISTS — Role-based policies
-- ═══════════════════════════════════════════

-- Public catalog: anonymous users see approved+active artists only
CREATE POLICY "public_select_approved_artists"
  ON public.artists FOR SELECT TO anon
  USING (status = 'Aprobado' AND active = true);

-- Admin SELECT: full access (role checked via profiles table)
CREATE POLICY "admin_select_artists"
  ON public.artists FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Admin INSERT: only admins can create artists
CREATE POLICY "admin_insert_artists"
  ON public.artists FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Admin UPDATE: full update access
CREATE POLICY "admin_update_artists"
  ON public.artists FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Admin DELETE: only admins can delete artists
CREATE POLICY "admin_delete_artists"
  ON public.artists FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Artist SELECT own: artists can read their own record
CREATE POLICY "artist_select_own"
  ON public.artists FOR SELECT TO authenticated
  USING (artists.user_id = (SELECT auth.uid()));

-- Artist UPDATE own: artists can update their own record
CREATE POLICY "artist_update_own"
  ON public.artists FOR UPDATE TO authenticated
  USING (artists.user_id = (SELECT auth.uid()))
  WITH CHECK (artists.user_id = (SELECT auth.uid()));

-- ═══════════════════════════════════════════
-- INVITATIONS — Role-based policies
-- ═══════════════════════════════════════════

-- Anon: can read invitations (for token validation during /registro/[token])
CREATE POLICY "anon_select_invitation"
  ON public.invitations FOR SELECT TO anon
  USING (true);

-- Anon: can mark used_at when completing registration form
CREATE POLICY "anon_update_used"
  ON public.invitations FOR UPDATE TO anon
  USING (used_at IS NULL AND expires_at > now())
  WITH CHECK (used_at IS NOT NULL);

-- Admin: full access to invitations (role checked via profiles)
CREATE POLICY "admin_select_invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_insert_invitations"
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_update_invitations"
  ON public.invitations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_invitations"
  ON public.invitations FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );
