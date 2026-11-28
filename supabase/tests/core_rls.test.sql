-- RLS and helper behaviour of the core schema, exercised as the `authenticated` role with crafted JWT claims.
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- Fixtures (as postgres). The auth.users trigger fills members.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@example.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'links@example.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'plain@example.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'dead@example.test',   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a5', 'unver@example.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a6', 'both@example.test',   'authenticated', 'authenticated');

-- a1 admin, a2 cms.links, a3 none, a4 cms.website but deactivated, a5 admin+cms.website but NOT verified, a6 cms.website
insert into public.user_permissions (user_id, permission) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'cms.links'),
  ('00000000-0000-0000-0000-0000000000a4', 'cms.website'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin'),
  ('00000000-0000-0000-0000-0000000000a5', 'cms.website'),
  ('00000000-0000-0000-0000-0000000000a6', 'cms.website');
update public.members set deactivated_at = now() where user_id = '00000000-0000-0000-0000-0000000000a4';

-- One session per user; every session except a5's is verified.
insert into auth.sessions (id, user_id) select ('10000000-0000-0000-0000-0000000000' || right(user_id::text, 2))::uuid, user_id
  from public.members where user_id::text like '00000000-0000-0000-0000-0000000000a_';
insert into public.verified_sessions (session_id, user_id, method)
  select id, user_id, 'code' from auth.sessions
  where user_id::text like '00000000-0000-0000-0000-0000000000a_' and user_id <> '00000000-0000-0000-0000-0000000000a5';

-- Other rows (dev users, earlier publishes) may exist; remember how many so assertions can be relative.
create temp table baseline as select
  (select count(*) from public.publish_runs) as runs,
  (select count(*) from public.user_permissions) as perms;
grant select on baseline to authenticated;

-- A table registered for the website target, to test stamp, audit and the waiting count.
create table public.t_core_test (id uuid primary key default gen_random_uuid(), title jsonb not null,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid);
select public.enable_content('public.t_core_test', 'website');
insert into public.publish_runs (targets, state, started_at, finished_at, duration_sec)
  values ('{website}', 'live', now() - interval '1 hour', now() - interval '59 minutes', 70);
insert into public.t_core_test (title) values ('{"en":"Hello","ro":"Salut"}');
insert into public.publish_runs (targets, state) values ('{links}', 'building');

create function pg_temp.as_user(n text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', '00000000-0000-0000-0000-0000000000' || n,
    'session_id', '10000000-0000-0000-0000-0000000000' || n,
    'role', 'authenticated', 'email', 'x@example.test')::text, true);
  set local role authenticated;
end $$;

-- Audit rows exist already (user_permissions, members, t_core_test).
select ok((select count(*) from public.audit_log where row_id like '00000000-0000-0000-0000-0000000000a_%') > 5, 'fixtures produced audit rows');

-- ── unverified session (has admin + cms.website but no verified_sessions row) ──
select pg_temp.as_user('a5');
select is(public.is_member(), false, 'unverified: is_member false');
select is((select count(*) from public.audit_log)::int, 0, 'unverified: audit_log empty');
select is((select count(*) from public.members)::int, 0, 'unverified: members empty');
select is((select count(*) from public.permissions)::int, 0, 'unverified: permission catalog empty');
select is((select count(*) from public.user_permissions)::int, 0, 'unverified: own permissions hidden');
select is(public.my_session() -> 'verified', 'false'::jsonb, 'unverified: my_session not verified');
select is(public.my_session() -> 'permissions', '[]'::jsonb, 'unverified: my_session shows no permissions');
select throws_ok($$select public.publish_status()$$, '42501', 'not allowed', 'unverified: publish_status refused');
reset role;

-- ── verified member with no permissions ──
select pg_temp.as_user('a3');
select is(public.is_member(), true, 'plain: verified member');
select is((select count(*) from public.audit_log)::int, 0, 'plain: audit_log empty');
select is((select count(*) from public.members)::int, 0, 'plain: members hidden');
select is((select count(*) from public.permissions)::int, 3, 'plain: catalog readable');
select is((select count(*) from public.publish_runs)::int, 0, 'plain: publish_runs hidden');
select throws_ok($$insert into public.activity (action, target_label, module, href) values ('a','b','c','/')$$,
  '42501', null, 'plain: cannot write activity');
reset role;

-- ── cms.links ──
select pg_temp.as_user('a2');
select is((select count(*) from public.audit_log)::int, 0, 'cms.links: cannot read audit_log');
select ok((select count(*) from public.members where user_id = '00000000-0000-0000-0000-0000000000a1') = 1, 'cms.links: can read members');
select lives_ok($$insert into public.activity (action, target_label, module, href) values ('edited','x','Linktree','/links')$$,
  'cms.links: can log own activity');
select is((select actor_email from public.activity where actor_id = '00000000-0000-0000-0000-0000000000a2' order by id desc limit 1), 'links@example.test', 'activity: actor_email filled');
select throws_ok($$insert into public.activity (actor_id, action, target_label, module, href)
  values ('00000000-0000-0000-0000-0000000000a1', 'a', 'b', 'c', '/')$$,
  '42501', null, 'activity: cannot insert as someone else');
select is((select count(*) from public.publish_runs)::int, (select runs from baseline)::int + 2, 'cms.links: can read publish_runs (the baseline plus the two fixtures)');
reset role;

-- ── admin ──
select pg_temp.as_user('a1');
select ok((select count(*) from public.audit_log where row_id like '00000000-0000-0000-0000-0000000000a_%') > 5, 'admin: can read audit_log');
select is((select count(*) from public.user_permissions)::int, (select perms from baseline)::int, 'admin: sees all user_permissions');
select throws_ok($$update public.audit_log set item = 'x'$$, '42501', null, 'admin: cannot update audit_log');
select throws_ok($$delete from public.audit_log$$, '42501', null, 'admin: cannot delete audit_log');
select throws_ok($$insert into public.user_permissions (user_id, permission) values ('00000000-0000-0000-0000-0000000000a3', 'admin')$$,
  '42501', null, 'admin: permissions are written only by the service role');
reset role;

-- ── deactivated ──
select pg_temp.as_user('a4');
select is(public.is_member(), false, 'deactivated: is_member false');
select is((select count(*) from public.members)::int, 0, 'deactivated: members empty');
select is(public.my_session() -> 'verified', 'false'::jsonb, 'deactivated: my_session not verified');
reset role;

-- ── not even the table owner can change the audit log ──
select throws_ok($$delete from public.audit_log$$, '42501', 'audit_log is append-only', 'owner: audit_log is append-only');

-- ── hook: adds the permissions array; only supabase_auth_admin may run it (postgres cannot assume that role here,
--    so its grants and its select policy are checked directly) ──
select is(
  public.custom_access_token_hook(jsonb_build_object('user_id', '00000000-0000-0000-0000-0000000000a5', 'claims', '{"sub":"x"}'::jsonb)) #> '{claims,permissions}',
  '["admin","cms.website"]'::jsonb, 'hook: permissions claim added');
select is(
  public.custom_access_token_hook(jsonb_build_object('user_id', '00000000-0000-0000-0000-0000000000a3', 'claims', '{}'::jsonb)) #> '{claims,permissions}',
  '[]'::jsonb, 'hook: empty array without permissions');
select ok(has_function_privilege('supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.custom_access_token_hook(jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'hook: execute granted to supabase_auth_admin only');
select ok(has_table_privilege('supabase_auth_admin', 'public.user_permissions', 'select')
  and exists (select 1 from pg_policies where tablename = 'user_permissions' and 'supabase_auth_admin' = any (roles)),
  'hook: supabase_auth_admin can read user_permissions through a policy');

select * from finish();
rollback;
