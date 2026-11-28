-- Triggers and publish bookkeeping of the core schema.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'editor@example.test', 'authenticated', 'authenticated');
insert into auth.sessions (id, user_id) values ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1');
insert into public.verified_sessions (session_id, user_id, method) values ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'code');
select public.set_permissions('00000000-0000-0000-0000-0000000000b1', array['cms.website'], null);

-- members mirror
select is((select email from public.members where user_id = '00000000-0000-0000-0000-0000000000b1'), 'editor@example.test', 'members: mirrored from auth.users');
update auth.users set last_sign_in_at = now() where id = '00000000-0000-0000-0000-0000000000b1';
select ok((select last_sign_in_at from public.members where user_id = '00000000-0000-0000-0000-0000000000b1') is not null, 'members: last_sign_in_at synced');

-- audit: permission grant uses the member's email as the item and a composite row id
select is((select item from public.audit_log where table_name = 'user_permissions' and action = 'insert' order by id desc limit 1),
  'editor@example.test', 'audit: user_permissions item is the email');
select is((select row_id from public.audit_log where table_name = 'user_permissions' order by id desc limit 1),
  '00000000-0000-0000-0000-0000000000b1:cms.website', 'audit: composite row id');
-- sign-in alone is not audited
select is((select count(*) from public.audit_log where table_name = 'members' and action = 'update' and row_id = '00000000-0000-0000-0000-0000000000b1')::int, 0, 'audit: last_sign_in_at changes are skipped');

-- set_permissions replaces and audits the revoke
select public.set_permissions('00000000-0000-0000-0000-0000000000b1', array['cms.links'], null);
select is((select array_agg(permission order by permission) from public.user_permissions where user_id = '00000000-0000-0000-0000-0000000000b1'),
  array['cms.links'], 'set_permissions: replaces the set');
select is((select count(*) from public.audit_log where table_name = 'user_permissions' and action = 'delete' and row_id like '00000000-0000-0000-0000-0000000000b1:%')::int, 1, 'audit: revoke recorded');

-- content table: stamp + audit item + waiting count
create table public.t_core_test (id uuid primary key default gen_random_uuid(), title jsonb not null,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid);
select public.enable_content('public.t_core_test', 'website');
-- Content edited by others since the last publish also waits, so measure the change our fixture row makes.
select public.set_permissions('00000000-0000-0000-0000-0000000000b1', array['cms.website'], null);
create temp table waiting_before (website int, links int);
grant all on waiting_before to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000b1',
  'session_id', '10000000-0000-0000-0000-0000000000b1', 'role', 'authenticated')::text, true);
insert into waiting_before select (public.publish_status() #>> '{waiting,website}')::int, (public.publish_status() #>> '{waiting,links}')::int;
reset role;
-- Insert as the member (claims only, still the table owner) so the stamp and audit triggers see an actor.
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000b1', 'role', 'authenticated')::text, true);
insert into public.t_core_test (title) values ('{"en":"Hello","ro":"Salut"}');
select is((select created_by from public.t_core_test), '00000000-0000-0000-0000-0000000000b1'::uuid, 'stamp: created_by set');
select is((select item from public.audit_log where table_name = 't_core_test'), 'Hello', 'audit: item uses title.en');
select is((select actor_email from public.audit_log where table_name = 't_core_test'), 'editor@example.test', 'audit: actor email');

-- publish_status needs a cms member session
select public.set_permissions('00000000-0000-0000-0000-0000000000b1', array['cms.website'], null);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000b1',
  'session_id', '10000000-0000-0000-0000-0000000000b1', 'role', 'authenticated')::text, true);
select is((public.publish_status() #>> '{waiting,website}')::int - (select website from waiting_before), 1, 'publish_status: counts waiting website changes (members/permissions do not count)');
select is((public.publish_status() #>> '{waiting,links}')::int - (select links from waiting_before), 0, 'publish_status: links has nothing waiting');
reset role;

select * from finish();
rollback;
