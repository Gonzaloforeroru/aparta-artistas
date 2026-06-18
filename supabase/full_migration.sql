-- ═══════════════════════════════════════════════════════════════
-- APARTA-ARTISTAS: Full Database Migration
-- Pega esto completo en Supabase SQL Editor y ejecútalo una vez
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════
-- 1. PROFILES TABLE
-- ═══════════════════════════════════════════

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'admin' check (role in ('admin')),
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, display_name, avatar_url)
  values (
    new.id,
    'admin',
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════
-- 2. ARTISTS TABLE
-- ═══════════════════════════════════════════

create type public.artist_type as enum
  ('Cantante', 'DJ', 'Banda', 'Mariachi', 'Grupo Musical', 'Solista');

create type public.genre as enum
  ('Vallenato', 'Salsa', 'Electrónica', 'Pop', 'Rock',
   'Reggaeton', 'Tropical', 'Cumbia', 'Bachata');

create type public.artist_status as enum
  ('Pendiente', 'Aprobado', 'Rechazado');

create table public.artists (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  city             text not null,
  type             public.artist_type not null,
  genre            public.genre not null,
  phone            text not null,
  price            integer not null check (price >= 0),
  duration         text not null,
  photo            text,
  instagram        text,
  tiktok           text,
  youtube          text,
  spotify          text,
  status           public.artist_status not null default 'Pendiente',
  active           boolean not null default true,
  created_by       uuid references auth.users(id),
  invitation_token text,
  approved_by      uuid references auth.users(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.artists enable row level security;

create index artists_status_idx on public.artists(status);
create index artists_active_idx on public.artists(active);
create index artists_created_at_idx on public.artists(created_at desc);

create trigger artists_touch_updated_at
  before update on public.artists
  for each row execute function public.touch_updated_at();

ALTER FUNCTION public.touch_updated_at SET search_path = '';

-- ═══════════════════════════════════════════
-- 3. INVITATIONS TABLE
-- ═══════════════════════════════════════════

create table public.invitations (
  token        text primary key,
  email        text,
  created_by   uuid references auth.users(id) not null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '24 hours'),
  used_at      timestamptz
);

alter table public.invitations enable row level security;

create index invitations_expires_at_idx on public.invitations(expires_at);
create index invitations_email_idx on public.invitations(email);

alter table public.artists
  add constraint artists_invitation_token_fkey
  foreign key (invitation_token) references public.invitations(token);

-- ═══════════════════════════════════════════
-- 4. RLS POLICIES
-- ═══════════════════════════════════════════

-- Artists: anon ve aprobados
create policy "anon_select_approved"
  on public.artists for select to anon
  using (status = 'Aprobado' and active = true);

create policy "anon_insert_pending"
  on public.artists for insert to anon
  with check (status = 'Pendiente'::text::public.artist_status);

create policy "admin_artists_full"
  on public.artists for all to authenticated
  using (true)
  with check (true);

-- Invitations
create policy "anon_select_invitation"
  on public.invitations for select to anon
  using (true);

create policy "anon_update_used"
  on public.invitations for update to anon
  using (used_at is null and expires_at > now())
  with check (used_at is not null);

create policy "admin_invitations_full"
  on public.invitations for all to authenticated
  using (true)
  with check (true);

-- Profiles
create policy "admin_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "admin_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ═══════════════════════════════════════════
-- 5. STORAGE
-- ═══════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('artist-photos', 'artist-photos', true);

create policy "anon_read_photos"
  on storage.objects for select to anon
  using (bucket_id = 'artist-photos');

create policy "admin_write_photos"
  on storage.objects for all to authenticated
  using (bucket_id = 'artist-photos')
  with check (bucket_id = 'artist-photos');

create policy "service_role_storage"
  on storage.objects for all to service_role
  using (bucket_id = 'artist-photos')
  with check (bucket_id = 'artist-photos');

-- ═══════════════════════════════════════════
-- 6. FIX PROFILES ROLE (allow artist role)
-- ═══════════════════════════════════════════

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'artist'));
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'artist';

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, avatar_url)
  VALUES (
    new.id,
    'artist',
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════
-- 7. ARTISTS USER LINK
-- ═══════════════════════════════════════════

ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_email ON public.artists(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id) WHERE user_id IS NOT NULL;

-- ═══════════════════════════════════════════
-- 8. REWRITE RLS (role-based)
-- ═══════════════════════════════════════════

-- Drop old policies
DROP POLICY IF EXISTS "anon_select_approved" ON public.artists;
DROP POLICY IF EXISTS "anon_insert_pending" ON public.artists;
DROP POLICY IF EXISTS "admin_artists_full" ON public.artists;
DROP POLICY IF EXISTS "anon_select_invitation" ON public.invitations;
DROP POLICY IF EXISTS "anon_update_used" ON public.invitations;
DROP POLICY IF EXISTS "admin_invitations_full" ON public.invitations;

-- Artists: public catalog
CREATE POLICY "public_select_approved_artists"
  ON public.artists FOR SELECT TO anon
  USING (status = 'Aprobado' AND active = true);

-- Artists: admin full access
CREATE POLICY "admin_select_artists"
  ON public.artists FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_insert_artists"
  ON public.artists FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

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

CREATE POLICY "admin_delete_artists"
  ON public.artists FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Artists: own record
CREATE POLICY "artist_select_own"
  ON public.artists FOR SELECT TO authenticated
  USING (artists.user_id = (SELECT auth.uid()));

CREATE POLICY "artist_update_own"
  ON public.artists FOR UPDATE TO authenticated
  USING (artists.user_id = (SELECT auth.uid()))
  WITH CHECK (artists.user_id = (SELECT auth.uid()));

-- Invitations: anon
CREATE POLICY "anon_select_invitation"
  ON public.invitations FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_update_used"
  ON public.invitations FOR UPDATE TO anon
  USING (used_at IS NULL AND expires_at > now())
  WITH CHECK (used_at IS NOT NULL);

-- Invitations: admin
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

-- ═══════════════════════════════════════════
-- 9. AUTHENTICATED CATALOG ACCESS
-- ═══════════════════════════════════════════

CREATE POLICY "authenticated_select_approved_artists"
  ON public.artists FOR SELECT TO authenticated
  USING (status = 'Aprobado' AND active = true);

-- ═══════════════════════════════════════════
-- 10. CLEANUP UNCONFIRMED USERS (pg_cron)
-- ═══════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

CREATE OR REPLACE FUNCTION public.cleanup_unconfirmed_users()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '24 hours'
    AND id NOT IN (
      SELECT id FROM auth.identities
      WHERE provider != 'email'
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE LOG 'cleanup_unconfirmed_users: deleted % unconfirmed users', deleted_count;
  END IF;
END;
$$;

SELECT cron.schedule(
  'cleanup-unconfirmed-users',
  '0 3 * * *',
  $$SELECT public.cleanup_unconfirmed_users()$$
);

-- ═══════════════════════════════════════════
-- 11. ADD WEBSITE TO ARTISTS
-- ═══════════════════════════════════════════

ALTER TABLE artists ADD COLUMN IF NOT EXISTS website text;

-- ═══════════════════════════════════════════
-- FIN
-- ═══════════════════════════════════════════
