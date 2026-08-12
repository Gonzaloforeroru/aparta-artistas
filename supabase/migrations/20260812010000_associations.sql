-- Saca la insignia de asociacion del sistema de tags y la convierte en un
-- concepto propio.
--
-- POR QUE
--
-- Un tag describe QUE HACE el artista (su genero, su formato). Una insignia de
-- asociacion dice QUIEN RESPONDE POR EL: es procedencia, no descripcion. Vivian
-- en la misma tabla y eso obligaba a parches raros — un CHECK para que ninguna
-- insignia pudiera ser no oficial, un `status` de reclamacion, una cola de
-- aprobacion — para simular en `tags` algo que nunca fue un tag.
--
-- MODELO
--
--   associations            el catalogo: nombre, color, logo
--   artists.association_id  UNA por artista (decision de producto)
--   invitations.association_id  el enlace concede la insignia al registrarse
--
-- Solo hay DOS formas de tener insignia: que el admin te la ponga, o registrarte
-- por un enlace configurado con ella. El artista no puede reclamarla, asi que
-- desaparece todo el circuito de "reclamo pendiente -> admin aprueba": el enlace
-- ES la prueba.
--
-- El nombre que se ve en la tarjeta es associations.name.


-- 1. Catalogo de asociaciones ----------------------------------------------------

create table if not exists public.associations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) between 2 and 80),
  slug       text not null,
  color      text,
  logo_url   text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint associations_slug_key unique (slug)
);

alter table public.associations enable row level security;

-- El publico necesita leerlas para pintar el nombre y el color en la tarjeta
-- del catalogo. Solo las activas: desactivar una la retira de la vista sin
-- borrar el historial de quien la tuvo.
drop policy if exists public_select_active_associations on public.associations;
create policy public_select_active_associations on public.associations
  for select to anon, authenticated
  using (active = true);

drop policy if exists admin_all_associations on public.associations;
create policy admin_all_associations on public.associations
  for all to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = (select auth.uid()) and p.role = 'admin'));


-- 2. La asociacion del artista ---------------------------------------------------
-- ON DELETE SET NULL y no CASCADE: borrar una asociacion no puede llevarse por
-- delante las fichas de sus artistas.

alter table public.artists
  add column if not exists association_id uuid
  references public.associations(id) on delete set null;

create index if not exists artists_association_id_idx
  on public.artists (association_id);


-- 3. Campanas de invitacion ------------------------------------------------------
--
-- personal  el enlace de siempre: un solo uso
-- campaign  enlace repartible: lo canjean varias personas hasta agotar cupo
--
-- Las filas que ya existian quedan como 'personal' con uses_count = 0, asi que
-- el flujo actual sigue funcionando igual.

alter table public.invitations
  add column if not exists kind text not null default 'personal'
    check (kind in ('personal','campaign'));

alter table public.invitations
  add column if not exists label text;

alter table public.invitations
  add column if not exists association_id uuid
    references public.associations(id) on delete set null;

alter table public.invitations
  add column if not exists max_uses int check (max_uses is null or max_uses > 0);

alter table public.invitations
  add column if not exists uses_count int not null default 0;


-- 4. Migrar las insignias que ya existan como tags --------------------------------
--
-- En una base donde ya se habian creado insignias (el entorno local tenia una),
-- se convierten en asociaciones y sus asignaciones pasan a artists.association_id.
-- En produccion no habia ninguna, asi que aqui no hace nada.

insert into public.associations (name, slug, color, created_at)
select t.name, t.slug, t.color, t.created_at
from public.tags t
where t.kind = 'badge'
on conflict (slug) do nothing;

update public.artists a
   set association_id = asoc.id
  from public.artist_tags at
  join public.tags t   on t.id = at.tag_id and t.kind = 'badge'
  join public.associations asoc on asoc.slug = t.slug
 where at.artist_id = a.id
   and at.status = 'approved'
   and a.association_id is null;


-- 5. Retirar 'badge' del sistema de tags -----------------------------------------
--
-- El CHECK tags_badge_always_official y el status de reclamacion existian solo
-- para sostener las insignias dentro de tags. Sin insignias, sobran.

delete from public.tags where kind = 'badge';

alter table public.tags drop constraint if exists tags_badge_always_official;

alter table public.tags drop constraint if exists tags_kind_check;
alter table public.tags add  constraint tags_kind_check
  check (kind in ('artist_type','genre','profession','gender'));

-- La policy de insercion del artista distinguia insignias para forzarlas a
-- 'pending'. Ya no existen, asi que se simplifica: todo lo que el artista se
-- asigna entra aprobado, y las insignias no pasan por aqui en absoluto.
drop policy if exists artist_insert_own_tags on public.artist_tags;
create policy artist_insert_own_tags on public.artist_tags
  for insert to authenticated
  with check (
    exists (select 1 from public.artists a
            where a.id = artist_tags.artist_id and a.user_id = (select auth.uid()))
    and source = 'self'
    and status = 'approved'
  );
