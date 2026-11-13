-- ===========================================================================
-- Cierra dos escaladas de privilegio via la API de Supabase (PostgREST).
--
-- Las politicas RLS de UPDATE filtran FILAS, no COLUMNAS, y
-- 20260811180000_grants.sql concede UPDATE sobre todas las columnas a
-- `authenticated`. Por eso, con su propio JWT:
--
--   1. cualquier usuario podia hacer  PATCH profiles {role: 'admin'}
--      (politica update_own_profile) y volverse administrador;
--   2. cualquier artista podia cambiar en su ficha status, active,
--      association_id, approved_by... (politica artist_update_own) y
--      aprobarse a si mismo o ponerse una insignia de asociacion.
--
-- Ademas `anon_insert_pending` dejaba a un anonimo insertar artistas con
-- cualquier association_id. Ningun codigo la usa (el registro por token va
-- con service-role en registerArtistWithToken), asi que se elimina.
--
-- Los guardas solo actuan cuando la peticion llega como `anon` o
-- `authenticated` (current_user que fija PostgREST). service_role, las
-- funciones security definer y el SQL editor no se ven afectados, asi que
-- handlePostLogin / ensureArtistProfile / redeem_invitation siguen igual.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. profiles: role (e id) solo los cambia el backend
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_privileged()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.role is distinct from old.role then
      raise exception 'No autorizado: el rol no se puede cambiar desde el cliente'
        using errcode = '42501';
    end if;
    if new.id is distinct from old.id then
      raise exception 'No autorizado: el id del perfil no se puede cambiar'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.profiles_guard_privileged();


-- ---------------------------------------------------------------------------
-- 2. artists: columnas de moderacion solo las cambia un admin o el backend
-- ---------------------------------------------------------------------------
create or replace function public.artists_guard_privileged()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  ) then
    return new;
  end if;

  if new.status          is distinct from old.status
  or new.active          is distinct from old.active
  or new.association_id  is distinct from old.association_id
  or new.approved_by     is distinct from old.approved_by
  or new.approved_at     is distinct from old.approved_at
  or new.created_by      is distinct from old.created_by
  or new.created_at      is distinct from old.created_at
  or new.email           is distinct from old.email
  or new.user_id         is distinct from old.user_id
  or new.invitation_token is distinct from old.invitation_token
  or new.id              is distinct from old.id
  then
    raise exception 'No autorizado: solo el administrador puede cambiar estado, visibilidad, asociacion o titularidad del artista'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists artists_guard_privileged on public.artists;
create trigger artists_guard_privileged
  before update on public.artists
  for each row execute function public.artists_guard_privileged();


-- ---------------------------------------------------------------------------
-- 3. Sin inserts anonimos en artists
-- ---------------------------------------------------------------------------
drop policy if exists anon_insert_pending on public.artists;
