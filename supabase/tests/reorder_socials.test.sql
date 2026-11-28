-- reorder_socials works for a cms.links member even under pg-safeupdate (which PostgREST loads), and is closed to others.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'links2@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'nobody@example.test', 'authenticated', 'authenticated');
insert into public.user_permissions (user_id, permission) values ('00000000-0000-0000-0000-0000000000d1', 'cms.links');
insert into auth.sessions (id, user_id) values
  ('10000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1'),
  ('10000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d2');
insert into public.verified_sessions (session_id, user_id, method) values
  ('10000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1', 'code'),
  ('10000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d2', 'code');
insert into public.social_links (network, url, sort) values
  ('github', 'https://github.com/example', 0), ('youtube', 'https://youtube.com/example', 1), ('tiktok', 'https://tiktok.com/example', 2)
  on conflict (network) do update set sort = excluded.sort;

create function pg_temp.as_user(n text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', '00000000-0000-0000-0000-0000000000' || n,
    'session_id', '10000000-0000-0000-0000-0000000000' || n,
    'role', 'authenticated', 'email', 'x@example.test')::text, true);
  set local role authenticated;
end $$;

-- Turn on the same guard PostgREST has (best effort: the library is preloaded for its role only).
do $$ begin
  begin load 'safeupdate'; exception when others then null; end;
end $$;

select pg_temp.as_user('d1');
select lives_ok($$select public.reorder_socials(array['tiktok', 'github', 'youtube'])$$, 'cms.links: can reorder');
select is(
  (select array_agg(network order by sort) from public.social_links where network in ('tiktok', 'github', 'youtube')),
  array['tiktok', 'github', 'youtube'], 'the listed order is stored');
select lives_ok($$select public.reorder_socials(array['youtube'])$$, 'a partial list is fine');
select is(
  (select network from public.social_links where network in ('tiktok', 'github', 'youtube') order by sort limit 1),
  'youtube', 'listed networks come first');

select pg_temp.as_user('d2');
select throws_ok($$select public.reorder_socials(array['github'])$$, '42501', null, 'no cms permission: refused');

select * from finish();
rollback;
