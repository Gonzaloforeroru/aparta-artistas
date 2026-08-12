-- RPC del flujo publico de invitacion.
--
-- Desde 20260812000000 el rol `anon` no tiene NINGUN acceso directo a
-- public.invitations (antes podia leer todos los tokens y modificar filas).
-- Estas dos funciones son el unico camino, y exponen solo lo justo:
--
--   validate_invitation  solo lee, para pintar la pagina del enlace
--   redeem_invitation    consume UN uso, de forma atomica
--
-- Son security definer a proposito: corren con permisos del dueno para poder
-- leer la tabla, pero nunca devuelven el token ni permiten escribir otra cosa
-- que no sea gastar un uso.
--
-- La logica de campanas viene de _pending_review/20260811160000, revisada y
-- reapuntada de badge_tag_id (tags) a association_id (associations).


-- validate_invitation ------------------------------------------------------------
-- Sin efectos secundarios. Devuelve tambien el nombre de la asociacion para
-- poder decirle al que se registra "te vas a unir avalado por X".

create or replace function public.validate_invitation(p_token text)
returns table(
  valid            boolean,
  kind             text,
  label            text,
  association_id   uuid,
  association_name text,
  email            text,
  reason           text
)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v record;
begin
  select i.kind, i.label, i.association_id, i.email,
         i.expires_at, i.used_at, i.max_uses, i.uses_count,
         a.name as assoc_name
  into   v
  from   public.invitations i
  left join public.associations a on a.id = i.association_id and a.active
  where  i.token = p_token;

  kind := v.kind; label := v.label;
  association_id := v.association_id; association_name := v.assoc_name;
  email := v.email;

  if not found then
    valid := false; kind := null; label := null;
    association_id := null; association_name := null; email := null;
    reason := 'not_found'; return next; return;
  end if;

  if v.expires_at <= now() then
    valid := false; reason := 'expired'; return next; return;
  end if;

  -- Personal: un solo uso.
  if v.kind = 'personal' and v.used_at is not null then
    valid := false; reason := 'already_used'; return next; return;
  end if;

  -- Campana: cupo agotado. max_uses null = sin limite.
  if v.kind = 'campaign' and v.max_uses is not null and v.uses_count >= v.max_uses then
    valid := false; reason := 'exhausted'; return next; return;
  end if;

  valid := true; reason := null; return next;
end;
$$;

revoke execute on function public.validate_invitation(text) from public;
grant  execute on function public.validate_invitation(text) to anon, authenticated;


-- redeem_invitation --------------------------------------------------------------
--
-- Todas las condiciones de validez van en el WHERE de un UNICO update. Eso es
-- lo que hace segura la campana: si dos personas canjean el mismo enlace a la
-- vez, el bloqueo de fila implicito del UPDATE hace que solo una gane cada
-- version, asi que es imposible pasarse del cupo. Comprobar antes y actualizar
-- despues tendria una carrera entre medias.

create or replace function public.redeem_invitation(p_token text)
returns table(ok boolean, association_id uuid, reason text)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_assoc uuid;
  v_kind  text;
  v_used  timestamptz;
  v_exp   timestamptz;
  v_max   int;
  v_cnt   int;
begin
  update public.invitations
     set used_at    = case when invitations.kind = 'personal'
                           then now() else invitations.used_at end,
         uses_count = invitations.uses_count + 1
   where invitations.token = p_token
     and invitations.expires_at > now()
     and (
           (invitations.kind = 'personal' and invitations.used_at is null)
           or
           (invitations.kind = 'campaign' and (invitations.max_uses is null
                                               or invitations.uses_count < invitations.max_uses))
         )
  returning invitations.association_id into v_assoc;

  if found then
    ok := true; association_id := v_assoc; reason := null;
    return next; return;
  end if;

  -- Solo si el UPDATE no toco nada se averigua el motivo, ya sin prisa.
  select i.kind, i.used_at, i.expires_at, i.max_uses, i.uses_count
    into v_kind, v_used, v_exp, v_max, v_cnt
    from public.invitations i where i.token = p_token;

  ok := false; association_id := null;

  if not found then
    reason := 'not_found';
  elsif v_exp <= now() then
    reason := 'expired';
  elsif v_kind = 'personal' and v_used is not null then
    reason := 'already_used';
  elsif v_kind = 'campaign' and v_max is not null and v_cnt >= v_max then
    reason := 'exhausted';
  else
    reason := 'not_found';
  end if;

  return next;
end;
$$;

revoke execute on function public.redeem_invitation(text) from public;
grant  execute on function public.redeem_invitation(text) to anon, authenticated;
