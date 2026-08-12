-- Invitation campaigns + security hardening.
--
-- Adds campaign columns to invitations, creates validate/redeem RPCs,
-- and closes two real security holes (anon_select_invitation, anon_update_used).


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. SCHEMA CHANGES — campaign columns on invitations
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.invitations
  add column if not exists kind text not null default 'personal'
    check (kind in ('personal','campaign'));

alter table public.invitations
  add column if not exists label text;

alter table public.invitations
  add column if not exists badge_tag_id uuid references public.tags(id) on delete set null;

alter table public.invitations
  add column if not exists max_uses int;

alter table public.invitations
  add column if not exists uses_count int not null default 0;

-- Existing rows get kind='personal', uses_count=0, rest null — the personal
-- flow keeps working exactly as before.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TRIGGER — badge_tag_id must point at a tag with kind = 'badge'
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.trig_check_badge_tag_id()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.badge_tag_id is not null then
    if not exists (
      select 1 from public.tags t
      where  t.id = new.badge_tag_id
        and  t.kind = 'badge'
    ) then
      raise exception 'badge_tag_id must reference a tag with kind = badge';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invitations_check_badge on public.invitations;
create trigger trg_invitations_check_badge
  before insert or update on public.invitations
  for each row execute function public.trig_check_badge_tag_id();


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. validate_invitation(p_token) — read-only check, no side effects
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.validate_invitation(p_token text)
returns table(
  valid        boolean,
  kind         text,
  label        text,
  badge_tag_id uuid,
  email        text,
  reason       text
)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_inv record;
begin
  select i.kind, i.label, i.badge_tag_id, i.email,
         i.expires_at, i.used_at, i.max_uses, i.uses_count
  into   v_inv
  from   public.invitations i
  where  i.token = p_token;

  if not found then
    valid := false;  kind := null;  label := null;
    badge_tag_id := null;  email := null;  reason := 'not_found';
    return next;  return;
  end if;

  -- Expired?
  if v_inv.expires_at <= now() then
    valid := false;  kind := v_inv.kind;  label := v_inv.label;
    badge_tag_id := v_inv.badge_tag_id;  email := v_inv.email;
    reason := 'expired';
    return next;  return;
  end if;

  -- Personal: already used?
  if v_inv.kind = 'personal' and v_inv.used_at is not null then
    valid := false;  kind := v_inv.kind;  label := v_inv.label;
    badge_tag_id := v_inv.badge_tag_id;  email := v_inv.email;
    reason := 'already_used';
    return next;  return;
  end if;

  -- Campaign: exhausted?
  if v_inv.kind = 'campaign'
     and v_inv.max_uses is not null
     and v_inv.uses_count >= v_inv.max_uses then
    valid := false;  kind := v_inv.kind;  label := v_inv.label;
    badge_tag_id := v_inv.badge_tag_id;  email := v_inv.email;
    reason := 'exhausted';
    return next;  return;
  end if;

  -- Valid
  valid := true;  kind := v_inv.kind;  label := v_inv.label;
  badge_tag_id := v_inv.badge_tag_id;  email := v_inv.email;
  reason := null;
  return next;
end;
$$;

revoke execute on function public.validate_invitation(text) from public;
grant  execute on function public.validate_invitation(text) to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. redeem_invitation(p_token) — atomic consume-one-use
--
-- Single UPDATE with all validity conditions in the WHERE clause.
-- Two concurrent callers hitting the same campaign token: only one wins
-- each row-version thanks to the implicit row lock of UPDATE.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.redeem_invitation(p_token text)
returns table(ok boolean, badge_tag_id uuid, reason text)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_badge uuid;
  v_kind  text;
  v_used  timestamptz;
  v_exp   timestamptz;
  v_max   int;
  v_cnt   int;
begin
  -- Atomic update: validity check + mutation in ONE statement
  update public.invitations
  set    used_at    = case when invitations.kind = 'personal'
                           then now()
                           else invitations.used_at end,
         uses_count = invitations.uses_count + 1
  where  invitations.token = p_token
    and  invitations.expires_at > now()
    and  (
           (invitations.kind = 'personal'  and invitations.used_at is null)
           or
           (invitations.kind = 'campaign'  and (invitations.max_uses is null
                                                or invitations.uses_count < invitations.max_uses))
         )
  returning invitations.badge_tag_id
  into v_badge;

  if found then
    ok := true;  badge_tag_id := v_badge;  reason := null;
    return next;  return;
  end if;

  -- Determine failure reason (read-only, after the failed UPDATE)
  select i.kind, i.used_at, i.expires_at, i.max_uses, i.uses_count
  into   v_kind, v_used, v_exp, v_max, v_cnt
  from   public.invitations i
  where  i.token = p_token;

  if not found then
    ok := false;  badge_tag_id := null;  reason := 'not_found';
    return next;  return;
  end if;

  if v_exp <= now() then
    ok := false;  badge_tag_id := null;  reason := 'expired';
  elsif v_kind = 'personal' and v_used is not null then
    ok := false;  badge_tag_id := null;  reason := 'already_used';
  elsif v_kind = 'campaign' and v_max is not null and v_cnt >= v_max then
    ok := false;  badge_tag_id := null;  reason := 'exhausted';
  else
    ok := false;  badge_tag_id := null;  reason := 'not_found';
  end if;

  return next;
end;
$$;

revoke execute on function public.redeem_invitation(text) from public;
grant  execute on function public.redeem_invitation(text) to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. SECURITY FIX — drop the two dangerous anon policies
--
-- anon_select_invitation:  lets anon read ALL tokens (token harvesting)
-- anon_update_used:        lets anon overwrite any column on unused rows
--
-- After this, anon has ZERO direct table access to invitations.
-- The only path is through validate_invitation / redeem_invitation RPCs.
-- The four admin_* policies remain untouched.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists anon_select_invitation on public.invitations;
drop policy if exists anon_update_used       on public.invitations;
