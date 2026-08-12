-- Reconecta los datos que ya existen con el modelo nuevo.
--
-- Hasta aqui tags/artist_tags y DIVIPOLA estaban creados pero VACIOS de
-- relaciones: ningun artista tenia tags, asi que cualquier filtro por tag
-- devolvia cero. Esta migracion es la que hace que lo nuevo muestre los datos
-- viejos.
--
-- Es puramente aditiva: no borra ni modifica artists.type/genre/city, que
-- siguen siendo la fuente de verdad hasta que la UI termine de migrar.


-- ---------------------------------------------------------------------------
-- 1. artists.type / artists.genre  ->  artist_tags
--
-- Se emparejan por slug, no por texto crudo, para que "Electrónica" case con
-- "electronica" sin depender de tildes.
-- source='admin': la asignacion la hizo el sistema, no el artista.
-- ---------------------------------------------------------------------------
insert into public.artist_tags (artist_id, tag_id, source, status)
select a.id, t.id, 'admin', 'approved'
from   public.artists a
join   public.tags t
  on   t.kind = 'artist_type'
 and   t.slug = public.slugify(a.type::text)
where  a.type is not null
on conflict (artist_id, tag_id) do nothing;

insert into public.artist_tags (artist_id, tag_id, source, status)
select a.id, t.id, 'admin', 'approved'
from   public.artists a
join   public.tags t
  on   t.kind = 'genre'
 and   t.slug = public.slugify(a.genre::text)
where  a.genre is not null
on conflict (artist_id, tag_id) do nothing;


-- ---------------------------------------------------------------------------
-- 2. Ciudad: texto libre -> codigo DANE
--
-- artists.city guarda nombres coloquiales ("Bogotá", "Cali") que NO coinciden
-- con el nombre oficial DIVIPOLA ("Bogotá, D.C.", "Santiago de Cali"). Se
-- resuelve en tres pasadas, de la mas estricta a la mas laxa, y lo que no
-- casa se queda en NULL en vez de adivinar.
-- ---------------------------------------------------------------------------
alter table public.artists
  add column if not exists municipality_code text
  references public.municipalities(code) on delete set null;

create index if not exists artists_municipality_code_idx
  on public.artists (municipality_code);

with alias(city_slug, code) as (
  -- Casos donde el nombre popular no es prefijo del oficial.
  values ('cali', '76001')
),
resolved as (
  select a.id as artist_id,
         coalesce(
           -- (a) alias explicito
           (select al.code from alias al where al.city_slug = public.slugify(a.city)),
           -- (b) nombre oficial exacto
           (select m.code from public.municipalities m
             where public.slugify(m.name) = public.slugify(a.city)
             limit 1),
           -- (c) el nombre popular es prefijo del oficial
           --     "bogota" -> "bogota-d-c", "cartagena" -> "cartagena-de-indias"
           (select m.code from public.municipalities m
             where public.slugify(m.name) like public.slugify(a.city) || '-%'
             order by length(m.name)
             limit 1)
         ) as code
  from public.artists a
  where a.city is not null
    and a.municipality_code is null
)
update public.artists a
set    municipality_code = r.code
from   resolved r
where  r.artist_id = a.id
  and  r.code is not null;
