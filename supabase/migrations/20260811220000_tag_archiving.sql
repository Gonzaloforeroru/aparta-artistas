-- Archivado logico de tags.
--
-- Se eligio eliminacion logica (archived_at) en vez de DELETE fisico por tres
-- razones:
--   1. Las asociaciones artist_tags sobreviven: un artista que tenia el tag
--      "Cumbia" no pierde su historial si el admin lo archiva temporalmente.
--   2. Se puede revertir (unarchive) sin re-crear el tag ni perder el UUID.
--   3. Auditoria: se conserva quien creo el tag y cuando, util para moderar
--      propuestas rechazadas.
--
-- La columna archived_at es nullable: NULL = activo, timestamptz = archivado.


-- 1. Columna de archivado -------------------------------------------------------
alter table public.tags add column if not exists archived_at timestamptz;


-- 2. Politica publica: excluir archivados ----------------------------------------
-- Se recrea la politica para que ademas de is_official = true exija
-- archived_at is null.  Asi los tags archivados desaparecen del catalogo
-- publico inmediatamente.
drop policy if exists public_select_official_tags on public.tags;
create policy public_select_official_tags on public.tags
  for select to anon, authenticated
  using (is_official = true and archived_at is null);


-- 3. Indice parcial para consultas frecuentes ------------------------------------
-- Las queries del catalogo filtran constantemente por (kind, sort_order, name)
-- pero solo entre tags no archivados.  Este indice parcial evita recorrer
-- los archivados.
create index if not exists tags_active_catalog_idx
  on public.tags (kind, sort_order, name)
  where archived_at is null;
