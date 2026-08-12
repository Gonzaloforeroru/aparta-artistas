-- Reduce el eje "tipo de artista" a tres formatos y libera las columnas espejo
-- del ENUM.
--
-- POR QUE
--
-- El eje estaba contaminado: 10 nombres existian a la vez como tipo de artista
-- y como genero (Mariachi, Papayera, Orquesta, Big Band, Norteno, Banda
-- Sinaloense, Cuarteto de Cuerdas, Serenata, Sonidero, Cantautor). La mayoria
-- de lo que habia ahi no era un formato sino el estilo que tocan.
--
-- Ademas partia los filtros sin avisar: "Grupo Musical", "Conjunto" y
-- "Ensamble" son la misma cosa, asi que un cliente que filtraba por uno no
-- encontraba a los marcados con otro.
--
-- El criterio pasa a ser "que te llega":
--
--   Solista     una persona
--   Agrupacion  varias personas
--   DJ          se pide por su nombre
--
-- No se pierde capacidad de busqueda: quien busque un mariachi lo sigue
-- encontrando por el GENERO "Mariachi", que ya existe. Un mariachi es ahora
-- Agrupacion + genero Mariachi; un saxofonista solo es Solista + Saxofonista.
--
-- Esta migracion tiene que ir la ultima porque deshace lo que sembraron
-- 20260811140000 (los 6 tipos originales) y 20260811210000 (el catalogo).


-- 1. Enum -> text ----------------------------------------------------------------
--
-- "Agrupacion" NO existe en el enum artist_type, asi que sin esto el valor no
-- se podria guardar: el codigo conservaria en silencio el anterior y la lista
-- del admin, el CSV y las metricas empezarian a mentir. A genre le pasaba ya:
-- el enum tiene 9 valores y el catalogo 198.
--
-- Se convierte a text en vez de borrar la columna para que las pantallas que
-- todavia la leen sigan vivas y se migren una a una. El tipo enum se deja
-- creado; se borra cuando nadie lea ya estas columnas.

alter table public.artists
  alter column type type text using type::text;

alter table public.artists
  alter column genre type text using genre::text;


-- 2. Generos que faltaban --------------------------------------------------------
-- Al absorber "Chirimia" y "Grupo Folclorico" dentro de Agrupacion, su unico
-- rastro pasa a ser el genero. Son los dos unicos que no estaban ya en el
-- catalogo, asi que se crean para no perder la busqueda.

insert into public.tags (kind, name, slug, is_official, sort_order)
select 'genre', v.name, public.slugify(v.name), true, v.ord
from (values ('Chirimia', 213), ('Folclor', 214)) as v(name, ord)
on conflict (kind, slug) do nothing;


-- 3. El formato nuevo ------------------------------------------------------------
-- Solista y DJ ya existen desde 20260811140000.

insert into public.tags (kind, name, slug, is_official, sort_order)
values ('artist_type', 'Agrupación', public.slugify('Agrupación'), true, 2)
on conflict (kind, slug) do nothing;


-- 4. Reapuntar a los artistas ----------------------------------------------------
--
-- Se hace con INSERT ... ON CONFLICT y no con UPDATE porque la PK de
-- artist_tags es (artist_id, tag_id): un artista marcado a la vez como
-- "Cantante" y "Solista" chocaria consigo mismo al reapuntar.
--
-- Todo lo que no sea solista ni dj cae en Agrupacion, incluidos los formatos
-- tradicionales (Mariachi, Papayera, Grupo Vallenato...), que conservan su
-- identidad en el eje de genero.

insert into public.artist_tags (artist_id, tag_id, source, status, created_at)
select at.artist_id, dest.id, at.source, at.status, at.created_at
from public.artist_tags at
join public.tags old on old.id = at.tag_id and old.kind = 'artist_type'
join public.tags dest
  on dest.kind = 'artist_type'
 and dest.slug = case
   when old.slug in ('solista','cantante','cantautor','cantaora','solista-instrumental') then 'solista'
   when old.slug in ('dj','dj-set-en-vivo','sonidero','turntablist') then 'dj'
   else 'agrupacion'
 end
on conflict (artist_id, tag_id) do nothing;


-- 5. Fuera los absorbidos --------------------------------------------------------
-- El CASCADE de artist_tags.tag_id se lleva los vinculos viejos, que en el paso
-- anterior ya quedaron duplicados en el formato destino.

delete from public.tags
 where kind = 'artist_type'
   and slug not in ('solista','agrupacion','dj');


-- 6. Las columnas espejo vuelven a decir la verdad --------------------------------

update public.artists a
   set type = (
     select t.name from public.artist_tags at
      join public.tags t on t.id = at.tag_id
     where at.artist_id = a.id and t.kind = 'artist_type'
     limit 1
   )
 where exists (
   select 1 from public.artist_tags at
    join public.tags t on t.id = at.tag_id
   where at.artist_id = a.id and t.kind = 'artist_type'
 );

update public.artists a
   set genre = (
     select t.name from public.artist_tags at
      join public.tags t on t.id = at.tag_id
     where at.artist_id = a.id and t.kind = 'genre' and at.status = 'approved'
     limit 1
   )
 where exists (
   select 1 from public.artist_tags at
    join public.tags t on t.id = at.tag_id
   where at.artist_id = a.id and t.kind = 'genre' and at.status = 'approved'
 );

-- Rezagados: artistas que nunca tuvieron tags (llegaron por CSV o por el
-- registro viejo) y conservan un valor de enum que ya no existe en el catalogo.
-- Sin esto seguirian saliendo como "Cantante" en el panel del admin.
update public.artists
   set type = case
     when type in ('Cantante','Solista') then 'Solista'
     when type = 'DJ' then 'DJ'
     else 'Agrupación'
   end
 where type is not null
   and type not in ('Solista','Agrupación','DJ');
