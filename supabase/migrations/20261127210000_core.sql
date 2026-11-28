-- Core schema: members, permissions, email-2FA state, audit log, activity, media, publish runs.
-- Contract: docs/backend.md §3, §5, §6. Content tables come in later migrations and register through enable_content().

-- ───────────────────────── identity ─────────────────────────

create table public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  invited_at timestamptz not null default now(),
  invited_by uuid references public.members (user_id) on delete set null,
  last_sign_in_at timestamptz,
  deactivated_at timestamptz
);
create unique index members_email_key on public.members (lower(email));

create table public.permissions (
  id text primary key,
  label text not null,
  description text not null,
  sort int not null default 0
);

create table public.user_permissions (
  user_id uuid not null references public.members (user_id) on delete cascade,
  permission text not null references public.permissions (id) on update cascade on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.members (user_id) on delete set null,
  primary key (user_id, permission)
);

insert into public.permissions (id, label, description, sort) values
  ('cms.website', 'Website content', 'Edit the pages, posts, seasons, gallery and other content of brickbot.ro in the CMS.', 10),
  ('cms.links',   'Links and short URLs', 'Edit the linktree and the short URLs in the CMS.', 20),
  ('admin',       'Admin', 'Invite and deactivate members, change permissions and read the audit log. Does not allow editing content.', 30);

-- Mirror auth.users into members. invited_by is set later by the admin-users function.
create function public.handle_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null then return new; end if;
  insert into public.members (user_id, email, invited_at, last_sign_in_at)
  values (new.id, new.email, coalesce(new.invited_at, new.created_at, now()), new.last_sign_in_at)
  on conflict (user_id) do update
    set email = excluded.email, last_sign_in_at = excluded.last_sign_in_at;
  return new;
end $$;

create trigger on_auth_user_change
  after insert or update of email, last_sign_in_at on auth.users
  for each row execute function public.handle_auth_user();

-- ───────────────────────── email second factor state (service role only) ─────────────────────────

-- FK to auth.sessions: signing out or expiring a session removes its verification.
create table public.verified_sessions (
  session_id uuid primary key references auth.sessions (id) on delete cascade,
  user_id uuid not null references public.members (user_id) on delete cascade,
  method text not null check (method in ('code', 'trusted-device', 'link')),
  verified_at timestamptz not null default now()
);
create index verified_sessions_user_idx on public.verified_sessions (user_id);

-- Only the SHA-256 hash of the device token is stored.
create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.members (user_id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz
);
create index trusted_devices_user_idx on public.trusted_devices (user_id);

-- Only the SHA-256 hash of the 6-digit code is stored.
create table public.email_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.members (user_id) on delete cascade,
  session_id uuid references auth.sessions (id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz
);
create index email_codes_user_idx on public.email_codes (user_id, created_at desc);

-- ───────────────────────── helpers used by every policy ─────────────────────────
-- They read the tables, never the JWT's permissions claim, so revocation is immediate.

create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.members m
    join public.verified_sessions v on v.user_id = m.user_id
    where m.user_id = auth.uid()
      and m.deactivated_at is null
      and v.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

create function public.has_permission(p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_member() and exists (
    select 1 from public.user_permissions up where up.user_id = auth.uid() and up.permission = p
  );
$$;

create function public.has_any_cms() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_permission('cms.website') or public.has_permission('cms.links');
$$;

-- { email, permissions, verified } for the caller. Permissions stay empty until the session is verified.
create function public.my_session() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', coalesce((select m.email from public.members m where m.user_id = auth.uid()), auth.jwt() ->> 'email'),
    'permissions', case when public.is_member()
      then coalesce((select jsonb_agg(up.permission order by up.permission) from public.user_permissions up where up.user_id = auth.uid()), '[]'::jsonb)
      else '[]'::jsonb end,
    'verified', public.is_member()
  );
$$;

-- Adds the `permissions` claim (UI gating only). Runs as supabase_auth_admin, which reads user_permissions through a policy.
create function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  perms jsonb;
begin
  select coalesce(jsonb_agg(up.permission order by up.permission), '[]'::jsonb) into perms
  from public.user_permissions up where up.user_id = (event ->> 'user_id')::uuid;
  return jsonb_set(event, '{claims,permissions}', perms);
end $$;

-- Atomic, audited replacement of a member's permissions. The admin-users function calls it with the service key and
-- passes the acting admin, because auth.uid() is null for service-role requests.
create function public.set_permissions(p_user uuid, p_permissions text[], p_actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.members where user_id = p_user) then
    raise exception 'unknown member' using errcode = 'P0002';
  end if;
  perform set_config('app.actor_id', coalesce(p_actor::text, ''), true);
  delete from public.user_permissions where user_id = p_user and permission <> all (p_permissions);
  insert into public.user_permissions (user_id, permission, granted_by)
  select p_user, p, p_actor from unnest(p_permissions) p
  on conflict do nothing;
end $$;

-- ───────────────────────── audit log and activity ─────────────────────────

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  item text not null,
  before jsonb,
  after jsonb
);
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_table_idx on public.audit_log (table_name, at desc);
create index audit_log_actor_idx on public.audit_log (actor_email, at desc);

-- Append-only even for the service role and the table owner.
create function public.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;
create trigger audit_log_no_change before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- Generic audit trigger. Optional trigger arguments name columns whose changes alone are not worth a row
-- (members ignores last_sign_in_at). The actor is auth.uid(), or app.actor_id when a function set it.
create function public.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_ignore text[] := coalesce(tg_argv, '{}'::text[]);
  v_actor uuid := coalesce(auth.uid(), nullif(current_setting('app.actor_id', true), '')::uuid);
  v_id text;
  v_item text;
  k text;
  v jsonb;
begin
  if tg_op = 'UPDATE' and (v_old - v_ignore) = (v_new - v_ignore) then
    return null;
  end if;

  -- Primary key, joined with ':' when composite (user_permissions).
  select string_agg(v_row ->> a.attname, ':' order by u.ord) into v_id
  from pg_index i
  cross join lateral unnest(i.indkey::int2[]) with ordinality u (attnum, ord)
  join pg_attribute a on a.attrelid = i.indrelid and a.attnum = u.attnum
  where i.indrelid = tg_relid and i.indisprimary;

  -- Readable name: title.en, title, name.en, name, label.en, label, slug, email, key, then the member's email, then the id.
  foreach k in array array['title', 'name', 'label'] loop
    v := v_row -> k;
    if v is not null then
      v_item := case jsonb_typeof(v) when 'object' then v ->> 'en' when 'string' then v #>> '{}' end;
      exit when nullif(v_item, '') is not null;
      v_item := null;
    end if;
  end loop;
  if v_item is null then
    foreach k in array array['slug', 'email', 'key'] loop
      v_item := nullif(v_row ->> k, '');
      exit when v_item is not null;
    end loop;
  end if;
  if v_item is null and v_row ? 'user_id' then
    select m.email into v_item from public.members m where m.user_id = (v_row ->> 'user_id')::uuid;
  end if;

  insert into public.audit_log (actor_id, actor_email, table_name, row_id, action, item, before, after)
  values (
    v_actor,
    (select m.email from public.members m where m.user_id = v_actor),
    tg_table_name, coalesce(v_id, ''), lower(tg_op), coalesce(v_item, v_id, ''),
    v_old, v_new
  );
  return null;
end $$;

-- Sets created_*/updated_* on content tables. Columns that a table lacks are ignored.
create function public.stamp_edited() returns trigger
language plpgsql set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new := jsonb_populate_record(new, jsonb_build_object(
      'created_at', now(), 'created_by', uid, 'updated_at', now(), 'updated_by', uid));
  else
    new := jsonb_populate_record(new, jsonb_build_object(
      'created_at', to_jsonb(old) -> 'created_at', 'created_by', to_jsonb(old) -> 'created_by',
      'updated_at', now(), 'updated_by', coalesce(uid, (to_jsonb(old) ->> 'updated_by')::uuid)));
  end if;
  return new;
end $$;

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid not null default auth.uid() references public.members (user_id),
  actor_email text not null default '',
  action text not null,
  target_label text not null,
  detail text,
  module text not null,
  href text not null
);
create index activity_at_idx on public.activity (at desc);

create function public.activity_fill_actor() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select m.email into new.actor_email from public.members m where m.user_id = new.actor_id;
  return new;
end $$;
create trigger activity_fill_actor before insert on public.activity
  for each row execute function public.activity_fill_actor();

-- ───────────────────────── media ─────────────────────────

create table public.media (
  key text primary key,
  kind text not null check (kind in ('image', 'svg', 'pdf', 'video', 'other')),
  folder text not null default '',
  size bigint,
  width int,
  height int,
  widths int[],
  poster text,
  uploaded_by uuid not null default auth.uid() references public.members (user_id),
  uploaded_at timestamptz not null default now()
);
create index media_folder_idx on public.media (folder);
create index media_uploaded_idx on public.media (uploaded_at desc);

-- ───────────────────────── publishing ─────────────────────────

create table public.publish_runs (
  id uuid primary key default gen_random_uuid(),
  targets text[] not null check (targets <> '{}' and targets <@ array['website', 'links']),
  state text not null default 'building' check (state in ('building', 'live', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  started_by uuid references public.members (user_id) on delete set null,
  duration_sec int
);
create index publish_runs_started_idx on public.publish_runs (started_at desc);

-- Which tables feed which site. Only these count toward "changes waiting" in publish_status().
-- A table may feed both (shared socials). Content tables register via enable_content(tbl, target).
create table public.publish_tables (
  table_name text not null,
  target text not null check (target in ('website', 'links')),
  primary key (table_name, target)
);

-- Attaches the stamp and audit triggers (and RLS) to a content table; optionally registers it for a publish target.
-- Usage in a later migration: select public.enable_content('public.blog_posts', 'website');
create function public.enable_content(tbl regclass, publish_target text default null) returns void
language plpgsql set search_path = '' as $$
declare
  v_name text := (select c.relname from pg_class c where c.oid = tbl);
begin
  execute format('alter table %s enable row level security', tbl);
  execute format('drop trigger if exists trg_stamp_edited on %s', tbl);
  execute format('create trigger trg_stamp_edited before insert or update on %s for each row execute function public.stamp_edited()', tbl);
  execute format('drop trigger if exists trg_audit on %s', tbl);
  execute format('create trigger trg_audit after insert or update or delete on %s for each row execute function public.audit_row()', tbl);
  if publish_target is not null then
    insert into public.publish_tables (table_name, target) values (v_name, publish_target) on conflict do nothing;
  end if;
end $$;

-- Shape of PublishStatus in apps/cms/src/lib/data/types.ts. A run stuck in 'building' for over 15 minutes is
-- reported as failed. `waiting` counts audit rows on registered tables since the last live run of each target
-- started (a change saved mid-build may not be in that build).
create function public.publish_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  last_run public.publish_runs;
  last_live public.publish_runs;
  v_state text;
  v_waiting jsonb := '{}'::jsonb;
  t text;
  since timestamptz;
begin
  if not public.has_any_cms() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into last_run from public.publish_runs order by started_at desc limit 1;
  select * into last_live from public.publish_runs where state = 'live' order by started_at desc limit 1;
  v_state := case
    when last_run.id is null then 'live'
    when last_run.state = 'building' and last_run.started_at < now() - interval '15 minutes' then 'failed'
    else last_run.state end;

  foreach t in array array['website', 'links'] loop
    select coalesce(max(r.started_at), '-infinity'::timestamptz) into since
    from public.publish_runs r where r.state = 'live' and t = any (r.targets);
    v_waiting := v_waiting || jsonb_build_object(t, (
      select count(*) from public.audit_log a
      where a.at > since
        and exists (select 1 from public.publish_tables p where p.table_name = a.table_name and p.target = t)));
  end loop;

  return jsonb_build_object(
    'state', v_state,
    'lastPublishedAt', last_live.finished_at,
    'lastDurationSec', last_live.duration_sec,
    'targets', to_jsonb(coalesce(last_run.targets, '{}'::text[])),
    'startedAt', case when v_state = 'building' then last_run.started_at end,
    'waiting', v_waiting
  );
end $$;

-- ───────────────────────── audit registration ─────────────────────────

-- Permission changes and member lifecycle. Sign-in timestamps alone are not audited.
create trigger trg_audit after insert or update or delete on public.user_permissions
  for each row execute function public.audit_row();
create trigger trg_audit after insert or update or delete on public.members
  for each row execute function public.audit_row('last_sign_in_at');

-- ───────────────────────── privileges ─────────────────────────
-- Supabase may grant new tables to the API roles by default; start from nothing and add back what policies use.

revoke all on public.members, public.permissions, public.user_permissions, public.verified_sessions,
  public.trusted_devices, public.email_codes, public.audit_log, public.activity, public.media,
  public.publish_runs, public.publish_tables from anon, authenticated;

grant select on public.members, public.permissions, public.user_permissions, public.audit_log,
  public.media, public.publish_runs to authenticated;
grant select, insert on public.activity to authenticated;
grant insert on public.media to authenticated;

-- Functions: nobody by default; then only who needs them.
revoke execute on function
  public.handle_auth_user(), public.is_member(), public.has_permission(text), public.has_any_cms(),
  public.my_session(), public.custom_access_token_hook(jsonb), public.set_permissions(uuid, text[], uuid),
  public.audit_row(), public.audit_log_immutable(), public.stamp_edited(), public.activity_fill_actor(),
  public.enable_content(regclass, text), public.publish_status()
  from public, anon, authenticated;

grant execute on function public.is_member(), public.has_permission(text), public.has_any_cms(),
  public.my_session(), public.publish_status() to authenticated, service_role;
grant execute on function public.set_permissions(uuid, text[], uuid), public.enable_content(regclass, text) to service_role;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.user_permissions to supabase_auth_admin;

-- ───────────────────────── row level security ─────────────────────────

alter table public.members enable row level security;
alter table public.permissions enable row level security;
alter table public.user_permissions enable row level security;
alter table public.verified_sessions enable row level security;
alter table public.trusted_devices enable row level security;
alter table public.email_codes enable row level security;
alter table public.audit_log enable row level security;
alter table public.activity enable row level security;
alter table public.media enable row level security;
alter table public.publish_runs enable row level security;
alter table public.publish_tables enable row level security;

-- verified_sessions, trusted_devices, email_codes, publish_tables: no policies (service role only).

create policy members_select on public.members for select to authenticated
  using (public.has_any_cms() or public.has_permission('admin'));

create policy permissions_select on public.permissions for select to authenticated
  using (public.is_member());

create policy user_permissions_select on public.user_permissions for select to authenticated
  using ((user_id = auth.uid() and public.is_member()) or public.has_permission('admin'));
create policy user_permissions_auth_hook on public.user_permissions for select to supabase_auth_admin
  using (true);

create policy audit_log_select on public.audit_log for select to authenticated
  using (public.has_permission('admin'));

create policy activity_select on public.activity for select to authenticated
  using (public.has_any_cms() or public.has_permission('admin'));
create policy activity_insert on public.activity for insert to authenticated
  with check (actor_id = auth.uid() and (public.has_any_cms() or public.has_permission('admin')));

create policy media_select on public.media for select to authenticated
  using (public.has_any_cms());
create policy media_insert on public.media for insert to authenticated
  with check (public.has_any_cms() and uploaded_by = auth.uid());

create policy publish_runs_select on public.publish_runs for select to authenticated
  using (public.has_any_cms());
