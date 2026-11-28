-- admin_set_member: audited under the acting admin; a null timestamp reactivates.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'boss@example.test',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'member@example.test', 'authenticated', 'authenticated');

select public.admin_set_member('00000000-0000-0000-0000-0000000000c2', '2026-01-01T00:00:00Z', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1');
select is((select deactivated_at from public.members where user_id = '00000000-0000-0000-0000-0000000000c2'), '2026-01-01T00:00:00Z'::timestamptz, 'deactivates');
select is((select invited_by from public.members where user_id = '00000000-0000-0000-0000-0000000000c2'), '00000000-0000-0000-0000-0000000000c1'::uuid, 'sets invited_by');
select is((select actor_email from public.audit_log where table_name = 'members' and action = 'update'
  and row_id = '00000000-0000-0000-0000-0000000000c2' order by id desc limit 1), 'boss@example.test', 'audit: actor email recorded');

select public.admin_set_member('00000000-0000-0000-0000-0000000000c2', null, null, '00000000-0000-0000-0000-0000000000c1');
select is((select deactivated_at from public.members where user_id = '00000000-0000-0000-0000-0000000000c2'), null, 'null reactivates');
select is((select invited_by from public.members where user_id = '00000000-0000-0000-0000-0000000000c2'), '00000000-0000-0000-0000-0000000000c1'::uuid, 'invited_by kept when null is passed');
select is((select count(*) from public.audit_log where table_name = 'members' and action = 'update'
  and row_id = '00000000-0000-0000-0000-0000000000c2' and actor_id = '00000000-0000-0000-0000-0000000000c1')::int, 2, 'audit: both changes attributed');
select ok(not has_function_privilege('authenticated', 'public.admin_set_member(uuid, timestamptz, uuid, uuid)', 'execute')
  and has_function_privilege('service_role', 'public.admin_set_member(uuid, timestamptz, uuid, uuid)', 'execute'), 'execute: service_role only');

select * from finish();
rollback;
