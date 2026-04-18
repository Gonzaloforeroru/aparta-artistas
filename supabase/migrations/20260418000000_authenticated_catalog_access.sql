-- Fix: Authenticated users should also see approved+active artists in catalog
-- Currently only anon can see them, which breaks catalog for logged-in users
CREATE POLICY "authenticated_select_approved_artists"
  ON public.artists FOR SELECT TO authenticated
  USING (status = 'Aprobado' AND active = true);
