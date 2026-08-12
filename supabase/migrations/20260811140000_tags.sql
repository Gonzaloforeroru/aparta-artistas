-- Tags dinamicos + insignias.
--
-- Reemplaza los enums fijos artist_type/genre por un catalogo gestionable, y
-- permite que un artista tenga VARIOS valores por categoria.
--
-- Cinco categorias (`kind`):
--   artist_type  multivalor, publico, el artista puede proponer
--   genre        multivalor, publico, el artista puede proponer
--   profession   multivalor, publico, el artista puede proponer
--   gender       un valor,   PRIVADO, el artista puede proponer
--   badge        multivalor, publico, SOLO el admin crea; el artista reclama
--
-- La ciudad NO vive aqui: es un conjunto cerrado y oficial (ver *_divipola.sql).

-- En Supabase remoto las extensiones viven en el esquema `extensions`, no en
-- `public`. Se instalan ahi explicitamente para que el resultado sea el mismo
-- en local y en produccion; sin el SCHEMA, cada entorno las coloca donde le
-- dicta su search_path y slugify() acaba llamando a una funcion que no existe.
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;


-- ---------------------------------------------------------------------------
-- Normalizacion: "  Champeta  " y "champeta" deben ser el MISMO tag.
-- Se marca immutable a proposito para poder usarla en indices y constraints.
-- ---------------------------------------------------------------------------
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
strict
-- `extensions` va en el search_path y unaccent() se deja SIN calificar: con
-- `public.unaccent(...)` hard-codeado esta funcion reventaba en produccion, y
-- se usa mas abajo en esta misma migracion para sembrar el catalogo.
set search_path = public, extensions, pg_catalog
as $$
  select trim(both '-' from
    regexp_replace(
      lower(unaccent(regexp_replace(trim(p_text), '\s+', ' ', 'g'))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;


-- ---------------------------------------------------------------------------
-- Catalogo de tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('artist_type','genre','profession','gender','badge')),
  name        text not null check (length(trim(name)) between 2 and 40),
  slug        text not null,
  color       text,
  -- is_official = false -> propuesto por un artista, invisible para los demas
  -- hasta que el admin lo apruebe. Esto es lo que evita que un typo se
  -- propague por los selects de todo el mundo.
  is_official boolean not null default true,
  sort_order  int not null default 0,
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz not null default now(),
  unique (kind, slug)
);

-- Las insignias solo las crea el admin, nunca nacen como propuesta.
alter table public.tags drop constraint if exists tags_badge_always_official;
alter table public.tags add constraint tags_badge_always_official
  check (kind <> 'badge' or is_official = true);

create index if not exists tags_kind_official_idx on public.tags (kind, is_official, sort_order, name);
-- Para la sugerencia difusa "Quisiste decir Vallenato?"
create index if not exists tags_name_trgm_idx on public.tags using gin (name gin_trgm_ops);


-- ---------------------------------------------------------------------------
-- Artista <-> tag (multivalor para los cinco kinds)
-- ---------------------------------------------------------------------------
create table if not exists public.artist_tags (
  artist_id  uuid not null references public.artists(id) on delete cascade,
  tag_id     uuid not null references public.tags(id)    on delete cascade,
  -- de donde salio la asignacion
  source     text not null default 'self'
             check (source in ('self','invitation','admin')),
  -- solo relevante para badges: un reclamo del artista queda 'pending' hasta
  -- que el admin lo aprueba. Lo que llega por campana o lo pone el admin
  -- entra directo como 'approved'.
  status     text not null default 'approved'
             check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  primary key (artist_id, tag_id)
);

create index if not exists artist_tags_tag_idx    on public.artist_tags (tag_id);
create index if not exists artist_tags_status_idx on public.artist_tags (status) where status = 'pending';


-- ---------------------------------------------------------------------------
-- Seed: los valores que hoy viven en los enums pasan a ser tags oficiales.
-- Nada se pierde; los artistas existentes se reconectan en la migracion final.
-- ---------------------------------------------------------------------------
insert into public.tags (kind, name, slug, is_official, sort_order)
select v.kind, v.name, public.slugify(v.name), true, v.ord
from (values
  ('artist_type', 'Cantante',      1),
  ('artist_type', 'DJ',            2),
  ('artist_type', 'Banda',         3),
  ('artist_type', 'Mariachi',      4),
  ('artist_type', 'Grupo Musical', 5),
  ('artist_type', 'Solista',       6),
  ('genre',       'Vallenato',     1),
  ('genre',       'Salsa',         2),
  ('genre',       'Electrónica',   3),
  ('genre',       'Pop',           4),
  ('genre',       'Rock',          5),
  ('genre',       'Reggaeton',     6),
  ('genre',       'Tropical',      7),
  ('genre',       'Cumbia',        8),
  ('genre',       'Bachata',       9)
) as v(kind, name, ord)
on conflict (kind, slug) do nothing;


-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.tags       enable row level security;
alter table public.artist_tags enable row level security;

-- --- tags -------------------------------------------------------------------

-- Publico: solo lo aprobado. Un tag propuesto NO aparece en el select de nadie
-- mas; es la defensa principal contra la proliferacion de duplicados.
drop policy if exists public_select_official_tags on public.tags;
create policy public_select_official_tags on public.tags
  for select to anon, authenticated
  using (is_official = true);

-- El artista ademas ve los tags que el mismo propuso, aunque sigan pendientes,
-- para que su perfil no se vea vacio mientras espera aprobacion.
drop policy if exists artist_select_own_proposed_tags on public.tags;
create policy artist_select_own_proposed_tags on public.tags
  for select to authenticated
  using (
    exists (
      select 1
      from public.artist_tags at
      join public.artists a on a.id = at.artist_id
      where at.tag_id = tags.id
        and a.user_id = (select auth.uid())
    )
  );

drop policy if exists admin_all_tags on public.tags;
create policy admin_all_tags on public.tags
  for all to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- --- artist_tags ------------------------------------------------------------

-- Catalogo publico: solo tags de artistas aprobados y activos, y solo
-- asignaciones aprobadas. Una insignia reclamada pero no confirmada NO sale.
drop policy if exists public_select_artist_tags on public.artist_tags;
create policy public_select_artist_tags on public.artist_tags
  for select to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1 from public.artists a
      where a.id = artist_tags.artist_id
        and a.status = 'Aprobado'
        and a.active = true
    )
  );

drop policy if exists artist_select_own_tags on public.artist_tags;
create policy artist_select_own_tags on public.artist_tags
  for select to authenticated
  using (
    exists (select 1 from public.artists a
            where a.id = artist_tags.artist_id and a.user_id = (select auth.uid()))
  );

-- El artista gestiona sus propias asignaciones, pero NUNCA puede auto-aprobarse
-- una insignia: si el tag es badge, la fila queda forzada a 'pending'.
drop policy if exists artist_insert_own_tags on public.artist_tags;
create policy artist_insert_own_tags on public.artist_tags
  for insert to authenticated
  with check (
    exists (select 1 from public.artists a
            where a.id = artist_tags.artist_id and a.user_id = (select auth.uid()))
    and source = 'self'
    and (
      status = 'approved' and not exists (
        select 1 from public.tags t where t.id = artist_tags.tag_id and t.kind = 'badge'
      )
      or
      status = 'pending'  and exists (
        select 1 from public.tags t where t.id = artist_tags.tag_id and t.kind = 'badge'
      )
    )
  );

drop policy if exists artist_delete_own_tags on public.artist_tags;
create policy artist_delete_own_tags on public.artist_tags
  for delete to authenticated
  using (
    exists (select 1 from public.artists a
            where a.id = artist_tags.artist_id and a.user_id = (select auth.uid()))
  );

drop policy if exists admin_all_artist_tags on public.artist_tags;
create policy admin_all_artist_tags on public.artist_tags
  for all to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin')
  );
