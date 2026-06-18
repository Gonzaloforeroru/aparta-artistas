-- ═══════════════════════════════════════════════════════════════
-- APARTA-ARTISTAS: RESET + MIGRACIÓN LIMPIA
-- ⚠️  BORRA TODO y recrea desde cero. Solo usar en proyecto nuevo sin datos.
-- Pega esto completo en Supabase SQL Editor y ejecútalo una vez.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- PASO 0: LIMPIAR TODO LO EXISTENTE
-- ───────────────────────────────────────────

-- Drop triggers en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop cron job si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-unconfirmed-users');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop tablas (cascade borra políticas, triggers, constraints, indexes)
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop tipos enum
DROP TYPE IF EXISTS public.artist_type CASCADE;
DROP TYPE IF EXISTS public.genre CASCADE;
DROP TYPE IF EXISTS public.artist_status CASCADE;

-- Drop funciones
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_unconfirmed_users() CASCADE;

-- Drop políticas de storage
DROP POLICY IF EXISTS "anon_read_photos" ON storage.objects;
DROP POLICY IF EXISTS "admin_write_photos" ON storage.objects;
DROP POLICY IF EXISTS "service_role_storage" ON storage.objects;

-- ───────────────────────────────────────────
-- PASO 1: PROFILES
-- ───────────────────────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'artist' check (role in ('admin', 'artist')),
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, display_name, avatar_url)
  values (
    new.id,
    'artist',
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

-- ───────────────────────────────────────────
-- PASO 2: ARTISTS
-- ───────────────────────────────────────────

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
  website          text,
  status           public.artist_status not null default 'Pendiente',
  active           boolean not null default true,
  created_by       uuid references auth.users(id),
  invitation_token text,
  approved_by      uuid references auth.users(id),
  approved_at      timestamptz,
  email            text,
  user_id          uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.artists enable row level security;

create index artists_status_idx on public.artists(status);
create index artists_active_idx on public.artists(active);
create index artists_created_at_idx on public.artists(created_at desc);
create unique index idx_artists_email on public.artists(lower(email));
create unique index idx_artists_user_id on public.artists(user_id) where user_id is not null;

create trigger artists_touch_updated_at
  before update on public.artists
  for each row execute function public.touch_updated_at();

-- ───────────────────────────────────────────
-- PASO 3: INVITATIONS
-- ───────────────────────────────────────────

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

-- ───────────────────────────────────────────
-- PASO 4: RLS POLICIES (role-based)
-- ───────────────────────────────────────────

-- ARTISTS: catálogo público (anon)
create policy "public_select_approved_artists"
  on public.artists for select to anon
  using (status = 'Aprobado' and active = true);

-- ARTISTS: catálogo (authenticated)
create policy "authenticated_select_approved_artists"
  on public.artists for select to authenticated
  using (status = 'Aprobado' and active = true);

-- ARTISTS: anon puede insertar pendiente (registro via token)
create policy "anon_insert_pending"
  on public.artists for insert to anon
  with check (status = 'Pendiente'::text::public.artist_status);

-- ARTISTS: admin full
create policy "admin_select_artists"
  on public.artists for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

create policy "admin_insert_artists"
  on public.artists for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

create policy "admin_update_artists"
  on public.artists for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

create policy "admin_delete_artists"
  on public.artists for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

-- ARTISTS: artista ve/edita su propio registro
create policy "artist_select_own"
  on public.artists for select to authenticated
  using (artists.user_id = (select auth.uid()));

create policy "artist_update_own"
  on public.artists for update to authenticated
  using (artists.user_id = (select auth.uid()))
  with check (artists.user_id = (select auth.uid()));

-- INVITATIONS: anon valida token
create policy "anon_select_invitation"
  on public.invitations for select to anon
  using (true);

create policy "anon_update_used"
  on public.invitations for update to anon
  using (used_at is null and expires_at > now())
  with check (used_at is not null);

-- INVITATIONS: admin full
create policy "admin_select_invitations"
  on public.invitations for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

create policy "admin_insert_invitations"
  on public.invitations for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

create policy "admin_update_invitations"
  on public.invitations for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

create policy "admin_delete_invitations"
  on public.invitations for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

-- PROFILES: usuario lee/actualiza el suyo
create policy "select_own_profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "update_own_profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ───────────────────────────────────────────
-- PASO 5: STORAGE
-- ───────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('artist-photos', 'artist-photos', true)
on conflict (id) do nothing;

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

-- ───────────────────────────────────────────
-- PASO 6: CLEANUP CRON (auto-borra usuarios sin confirmar)
-- ───────────────────────────────────────────

create extension if not exists pg_cron;
grant usage on schema cron to postgres;

create or replace function public.cleanup_unconfirmed_users()
returns void language plpgsql security definer set search_path = '' as $$
declare
  deleted_count integer;
begin
  delete from auth.users
  where email_confirmed_at is null
    and created_at < now() - interval '24 hours'
    and id not in (select id from auth.identities where provider != 'email');
  get diagnostics deleted_count = row_count;
  if deleted_count > 0 then
    raise log 'cleanup_unconfirmed_users: deleted % unconfirmed users', deleted_count;
  end if;
end;
$$;

select cron.schedule(
  'cleanup-unconfirmed-users',
  '0 3 * * *',
  $$select public.cleanup_unconfirmed_users()$$
);

-- ═══════════════════════════════════════════
-- FIN — base de datos lista y limpia
-- ═══════════════════════════════════════════
