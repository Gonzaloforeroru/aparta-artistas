-- Tag proposal + fuzzy-suggestion RPCs.
--
-- propose_tag:          reuse-or-create a tag, with rate limiting.
-- suggest_similar_tag:  "did you mean …?" via pg_trgm similarity (threshold 0.55).


-- ---------------------------------------------------------------------------
-- Portabilidad de extensiones.
--
-- En local `unaccent`/`pg_trgm` caen en `public`; en Supabase remoto viven en
-- el esquema `extensions`. slugify() se creo en *_tags.sql llamando a
-- `public.unaccent(...)` hard-codeado, lo que la romperia en produccion.
-- Se redefine aqui SIN calificar el esquema, apoyandose en el search_path fijo
-- de la funcion, que cubre ambos casos. Mismo criterio para similarity().
--
-- slugify no participa en ningun indice ni constraint, asi que redefinirla es
-- seguro (no requiere reindexar).
-- ---------------------------------------------------------------------------
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
strict
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
-- propose_tag(p_kind, p_name)
--
-- * Normalises the name via slugify().
-- * Reuses an existing tag when (kind, slug) already exists — NEVER duplicates.
-- * Rejects 'badge' kind (admin-only via direct INSERT under RLS).
-- * Rate-limits: 5 tags / 24 h per authenticated user, 50 / h globally for anon.
-- ---------------------------------------------------------------------------
create or replace function public.propose_tag(p_kind text, p_name text)
returns table(id uuid, name text, slug text, is_official boolean)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
-- Los parametros OUT (id, name, slug, is_official) se llaman igual que columnas
-- de public.tags. Sin esto, `on conflict (kind, slug)` falla con
-- "column reference slug is ambiguous", porque PL/pgSQL intenta sustituir la
-- variable dentro del inference clause (que admite expresiones y por eso no se
-- puede calificar con el nombre de la tabla).
#variable_conflict use_column
declare
  v_slug  text;
  v_trim  text;
begin
  -- 1. Validate kind
  if p_kind = 'badge' then
    raise exception 'Badges can only be created by administrators';
  end if;
  if p_kind not in ('artist_type','genre','profession','gender') then
    raise exception 'Invalid tag kind: %. Must be artist_type, genre, profession or gender', p_kind;
  end if;

  -- 2. Validate name length
  v_trim := trim(p_name);
  if length(v_trim) < 2 or length(v_trim) > 40 then
    raise exception 'Tag name must be between 2 and 40 characters (got %)', length(v_trim);
  end if;

  -- 3. Normalise
  v_slug := public.slugify(v_trim);

  -- 4. Reuse before create (most important behaviour)
  if exists (select 1 from public.tags t where t.kind = p_kind and t.slug = v_slug) then
    return query
      select t.id, t.name, t.slug, t.is_official
      from   public.tags t
      where  t.kind = p_kind and t.slug = v_slug;
    return;
  end if;

  -- 5. Rate limit
  if auth.uid() is not null then
    if (select count(*)
        from   public.tags t
        where  t.created_by = auth.uid()
          and  t.is_official = false
          and  t.created_at  > now() - interval '24 hours') >= 5
    then
      raise exception 'Rate limit exceeded: maximum 5 tag proposals per 24 hours';
    end if;
  else
    if (select count(*)
        from   public.tags t
        where  t.is_official = false
          and  t.created_at  > now() - interval '1 hour') >= 50
    then
      raise exception 'Rate limit exceeded: too many anonymous tag proposals, try later';
    end if;
  end if;

  -- 6. Insert (ON CONFLICT guards the rare race between the EXISTS and here)
  return query
    insert into public.tags (kind, name, slug, is_official, created_by)
    values (p_kind, v_trim, v_slug, false, auth.uid())
    on conflict (kind, slug) do nothing
    returning tags.id, tags.name, tags.slug, tags.is_official;

  -- If a concurrent session won the insert, return its row
  if not found then
    return query
      select t.id, t.name, t.slug, t.is_official
      from   public.tags t
      where  t.kind = p_kind and t.slug = v_slug;
  end if;
end;
$$;

revoke execute on function public.propose_tag(text, text) from public;
grant  execute on function public.propose_tag(text, text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- suggest_similar_tag(p_kind, p_name)
--
-- Returns up to 3 official tags whose pg_trgm similarity >= 0.55.
-- Returns ZERO rows when an exact slug match exists (nothing to suggest).
-- ---------------------------------------------------------------------------
create or replace function public.suggest_similar_tag(p_kind text, p_name text)
returns table(id uuid, name text, slug text, similarity real)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_slug text;
begin
  v_slug := public.slugify(p_name);

  -- Exact official match → nothing to suggest
  if exists (
    select 1 from public.tags t
    where  t.kind = p_kind
      and  t.slug = v_slug
      and  t.is_official = true
  ) then
    return;  -- zero rows
  end if;

  return query
    select t.id,
           t.name,
           t.slug,
           similarity(t.name, p_name)::real as similarity
    from   public.tags t
    where  t.kind       = p_kind
      and  t.is_official = true
      and  similarity(t.name, p_name) >= 0.55
    order  by similarity(t.name, p_name) desc
    limit  3;
end;
$$;

revoke execute on function public.suggest_similar_tag(text, text) from public;
grant  execute on function public.suggest_similar_tag(text, text) to anon, authenticated;
