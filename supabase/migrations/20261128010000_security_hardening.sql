-- Security audit fixes: media key shape guard, session revocation on deactivation, a stable 2FA address.

-- ───────────────────────── media keys ─────────────────────────
-- The shape the CMS uploads (CLAUDE.md §11) and the `media` function validates before signing. Rows are written by
-- members, and the function deletes whatever objects a row names, so the database refuses any other shape.
-- Keep TOP_FOLDERS in supabase/functions/_shared/keys.ts in step with this list.
create function public.media_row_valid(p_key text, p_kind text, p_widths int[], p_poster text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  segs text[];
  leaf text;
  d text;
  w int;
  name_re constant text := '[a-z0-9]+(-[a-z0-9]+)*';
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 200 then return false; end if;
  segs := string_to_array(p_key, '/');
  if array_length(segs, 1) < 2 or array_length(segs, 1) > 7 then return false; end if;
  if not (segs[1] = any (array['brand','site','seasons','gallery','blog','sponsors','documents','press','projects','links','external'])) then return false; end if;
  leaf := segs[array_length(segs, 1)];
  for i in 1 .. array_length(segs, 1) - 1 loop
    d := segs[i];
    if d !~ ('^' || name_re || '$') then return false; end if;
  end loop;

  if p_kind = 'image' then
    -- the key is the base; every variant is {key}-{width}.webp
    if leaf !~ ('^' || name_re || '\.[a-z0-9]{6}$') then return false; end if;
    if p_widths is null or cardinality(p_widths) = 0 or cardinality(p_widths) > 4 then return false; end if;
    foreach w in array p_widths loop
      if w is null or w < 1 or w > 2560 then return false; end if;
    end loop;
    if (select count(distinct x) from unnest(p_widths) x) <> cardinality(p_widths) then return false; end if;
    return p_poster is null;
  elsif p_kind = 'svg' or p_kind = 'pdf' then
    if leaf !~ ('^' || name_re || '\.[a-z0-9]{6}\.' || p_kind || '$') then return false; end if;
    return (p_widths is null or cardinality(p_widths) = 0) and p_poster is null;
  elsif p_kind = 'video' then
    if leaf !~ ('^' || name_re || '\.[a-z0-9]{6}\.mp4$') then return false; end if;
    return (p_widths is null or cardinality(p_widths) = 0)
      and (p_poster is null or p_poster = regexp_replace(p_key, '\.mp4$', '.poster.webp'));
  end if;
  return false;
end $$;

create function public.media_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not public.media_row_valid(new.key, new.kind, new.widths, new.poster) then
    raise exception 'invalid media key' using errcode = '23514', constraint = 'media_key_shape';
  end if;
  return new;
end $$;

create trigger media_guard before insert or update of key, kind, widths, poster on public.media
  for each row execute function public.media_guard();

-- ───────────────────────── deactivation ends every session ─────────────────────────
-- Deleting auth.sessions cascades to refresh tokens and verified_sessions, so an old refresh token can't be used again
-- (not even after reactivation). Trusted browsers and pending codes go too, so reactivation starts from a clean 2FA state.
create or replace function public.admin_set_member(p_user uuid, p_deactivated_at timestamptz, p_invited_by uuid, p_actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.actor_id', coalesce(p_actor::text, ''), true);
  update public.members set deactivated_at = p_deactivated_at, invited_by = coalesce(p_invited_by, invited_by) where user_id = p_user;
  if p_deactivated_at is not null then
    delete from auth.sessions where user_id = p_user;
    delete from public.verified_sessions where user_id = p_user;
    delete from public.trusted_devices where user_id = p_user;
    delete from public.email_codes where user_id = p_user;
  end if;
end $$;
revoke execute on function public.admin_set_member(uuid, timestamptz, uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_member(uuid, timestamptz, uuid, uuid) to service_role;

-- ───────────────────────── stable second-factor address ─────────────────────────
-- members.email is fixed when the account is created (the invite address); a later change of auth.users.email does not
-- move it, so the emailed code always goes to the address an admin invited. email-2fa reads it from here.
create or replace function public.handle_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null then return new; end if;
  insert into public.members (user_id, email, invited_at, last_sign_in_at)
  values (new.id, new.email, coalesce(new.invited_at, new.created_at, now()), new.last_sign_in_at)
  on conflict (user_id) do update set last_sign_in_at = excluded.last_sign_in_at;
  return new;
end $$;
