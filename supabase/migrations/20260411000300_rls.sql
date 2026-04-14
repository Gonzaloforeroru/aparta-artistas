-- 004: Row Level Security policies

-- ═══════════════════════════════════════════
-- ARTISTS
-- ═══════════════════════════════════════════

-- Anon: solo ve artistas aprobados y activos (catálogo público)
create policy "anon_select_approved"
  on public.artists for select to anon
  using (status = 'Aprobado' and active = true);

-- Anon: puede insertar con status Pendiente (registro via token)
-- La validación del token se hace en la Server Action, RLS es última línea
-- Double cast for reliable enum type matching
create policy "anon_insert_pending"
  on public.artists for insert to anon
  with check (status = 'Pendiente'::text::public.artist_status);

-- Admin: acceso total a artists
create policy "admin_artists_full"
  on public.artists for all to authenticated
  using (true)
  with check (true);

-- ═══════════════════════════════════════════
-- INVITATIONS
-- ═══════════════════════════════════════════

-- Anon: puede leer invitaciones (para validar token en /registro/[token])
create policy "anon_select_invitation"
  on public.invitations for select to anon
  using (true);

-- Anon: puede marcar used_at (cuando completa el form de registro)
create policy "anon_update_used"
  on public.invitations for update to anon
  using (used_at is null and expires_at > now())
  with check (used_at is not null);

-- Admin: acceso total a invitations
create policy "admin_invitations_full"
  on public.invitations for all to authenticated
  using (true)
  with check (true);

-- ═══════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════

-- Admin: lee su propio perfil
create policy "admin_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- Admin: actualiza su propio perfil
create policy "admin_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
