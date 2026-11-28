-- Audit fixes: media key shape guard, deactivation ends sessions, members.email is stable.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'boss@example.test',   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'member@example.test', 'authenticated', 'authenticated');

-- ───── media keys ─────
create function pg_temp.ins(p_key text, p_kind text, p_widths int[], p_poster text default null) returns void language sql as $$
  insert into public.media (key, kind, widths, poster, uploaded_by) values (p_key, p_kind, p_widths, p_poster, '00000000-0000-0000-0000-0000000000d2');
$$;

-- what the CMS writes
select lives_ok($$select pg_temp.ins('gallery/general/a.abc123', 'image', '{480,960,1600,2560}')$$, 'image row accepted');
select lives_ok($$select pg_temp.ins('seasons/decode/tiny.abc124', 'image', '{200}')$$, 'small original with its own width accepted');
select lives_ok($$select pg_temp.ins('sponsors/x.abc123.svg', 'svg', null)$$, 'svg row accepted');
select lives_ok($$select pg_temp.ins('documents/sponsor-deck-2026-27.abc123.pdf', 'pdf', null)$$, 'pdf row accepted');
select lives_ok($$select pg_temp.ins('gallery/general/c.abc123.mp4', 'video', null, 'gallery/general/c.abc123.poster.webp')$$, 'video row with its poster accepted');

-- the audited attacks
select throws_ok($$select pg_temp.ins('brand/logo.svg', 'svg', null)$$, '23514', null, 'hand-uploaded brand file refused (no id)');
select throws_ok($$select pg_temp.ins('seasons/decode/team-photo.webp', 'image', null)$$, '23514', null, 'placeholder key refused');
select throws_ok($$select pg_temp.ins('gallery/general/a.abc125', 'image', '{480}', 'brand/wordmark.svg')$$, '23514', null, 'poster on an image row refused');
select throws_ok($$select pg_temp.ins('gallery/general/c.abc126.mp4', 'video', null, 'brand/wordmark.svg')$$, '23514', null, 'foreign poster refused');
select throws_ok($$select pg_temp.ins('gallery/general/c.abc127.mp4', 'video', null, 'gallery/general/zzz.abc127.poster.webp')$$, '23514', null, 'poster of another video refused');
select throws_ok($$select pg_temp.ins('gallery/../brand/a.abc123', 'image', '{480}')$$, '23514', null, '.. segment refused');
select throws_ok($$select pg_temp.ins('../x/a.abc123', 'image', '{480}')$$, '23514', null, 'leading .. refused');
select throws_ok($$select pg_temp.ins('/gallery/a.abc123', 'image', '{480}')$$, '23514', null, 'absolute key refused');
select throws_ok($$select pg_temp.ins('gallery//a.abc123', 'image', '{480}')$$, '23514', null, 'empty segment refused');
select throws_ok($$select pg_temp.ins('secrets/a.abc123', 'image', '{480}')$$, '23514', null, 'unknown top folder refused');
select throws_ok($$select pg_temp.ins('gallery/Gallery/a.abc123', 'image', '{480}')$$, '23514', null, 'uppercase folder refused');
select throws_ok($$select pg_temp.ins('gallery/a.abc123', 'image', '{5000}')$$, '23514', null, 'width over 2560 refused');
select throws_ok($$select pg_temp.ins('gallery/a.abc128', 'image', '{480,480}')$$, '23514', null, 'duplicate widths refused');
select throws_ok($$select pg_temp.ins('gallery/a.abc129', 'other', null)$$, '23514', null, 'kind other refused');
select throws_ok($$update public.media set key = 'brand/logo.svg' where key = 'sponsors/x.abc123.svg'$$, '23514', null, 'update to a bad key refused');

-- ───── deactivation ends sessions ─────
insert into auth.sessions (id, user_id) values ('10000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d2');
insert into auth.refresh_tokens (instance_id, token, user_id, session_id, revoked)
  values ('00000000-0000-0000-0000-000000000000', 'tok-d2', '00000000-0000-0000-0000-0000000000d2', '10000000-0000-0000-0000-0000000000d2', false);
insert into public.verified_sessions (session_id, user_id, method) values ('10000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d2', 'code');
insert into public.trusted_devices (user_id, token_hash, expires_at) values ('00000000-0000-0000-0000-0000000000d2', 'hash-d2', now() + interval '1 day');
select public.admin_set_member('00000000-0000-0000-0000-0000000000d2', now(), null, '00000000-0000-0000-0000-0000000000d1');
select is((select count(*) from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000d2')::int
        + (select count(*) from auth.refresh_tokens where user_id = '00000000-0000-0000-0000-0000000000d2')::int
        + (select count(*) from public.verified_sessions where user_id = '00000000-0000-0000-0000-0000000000d2')::int
        + (select count(*) from public.trusted_devices where user_id = '00000000-0000-0000-0000-0000000000d2')::int, 0,
  'deactivation removes sessions, refresh tokens, verification and trusted devices');

-- ───── members.email is stable ─────
update auth.users set email = 'attacker@example.test', last_sign_in_at = now() where id = '00000000-0000-0000-0000-0000000000d2';
select is((select email from public.members where user_id = '00000000-0000-0000-0000-0000000000d2'), 'member@example.test', 'members.email survives an auth email change');

select * from finish();
rollback;
