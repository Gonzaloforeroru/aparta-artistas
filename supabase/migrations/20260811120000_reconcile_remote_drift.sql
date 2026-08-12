-- Reconcilia el estado real de produccion con las migraciones versionadas.
--
-- Detectado por chequeo de drift (2026-08-11) comparando el proyecto remoto
-- fplrquayqyudqrwvnlze contra el esquema reconstruido desde supabase/migrations/.
-- Columnas, enums y funciones coincidian; las politicas RLS no.
--
-- Esta migracion es idempotente y segura de aplicar tanto en una base nueva
-- (construida desde migraciones) como en produccion (donde ya esta aplicada
-- de facto). No modifica datos.


-- ---------------------------------------------------------------------------
-- 1. artists.anon_insert_pending  [CRITICO]
--
-- Existe en produccion pero nunca se versiono en una migracion.
-- Es la politica que permite al usuario anonimo insertar su propia fila al
-- registrarse desde /registro/[token]. Sin ella, cualquier entorno levantado
-- desde las migraciones tiene el registro publico roto: el INSERT es
-- rechazado por RLS.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'artists'
      and policyname = 'anon_insert_pending'
  ) then
    execute $ddl$
      create policy anon_insert_pending on public.artists
        for insert
        to anon
        with check (status = 'Pendiente'::artist_status)
    $ddl$;
  end if;
end
$$;


-- ---------------------------------------------------------------------------
-- 2. profiles: nombres de politica divergentes
--
-- La definicion es identica en ambos lados (id = auth.uid()); solo difiere el
-- nombre. Se adopta el nombre de produccion como fuente de verdad para que un
-- futuro `db push` no intente crear duplicados.
--
--   migraciones          ->  produccion
--   admin_select_own     ->  select_own_profile
--   admin_update_own     ->  update_own_profile
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'admin_select_own'
  ) then
    execute 'alter policy admin_select_own on public.profiles rename to select_own_profile';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'admin_update_own'
  ) then
    execute 'alter policy admin_update_own on public.profiles rename to update_own_profile';
  end if;
end
$$;
