-- RLS, constraints and bookkeeping of the content tables (20261127220000_content.sql), exercised as the `authenticated`
-- role with crafted JWT claims, like core_rls.test.sql. The tests make their own rows, so they pass with or without the seed.
begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

-- Fixtures (as postgres): same cast as the core tests.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'admin@example.test',   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'links@example.test',   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c5', 'unver@example.test',   'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c6', 'website@example.test', 'authenticated', 'authenticated');
-- c1 admin only, c2 cms.links, c5 admin + cms.website but NOT verified, c6 cms.website
insert into public.user_permissions (user_id, permission) values
  ('00000000-0000-0000-0000-0000000000c1', 'admin'),
  ('00000000-0000-0000-0000-0000000000c2', 'cms.links'),
  ('00000000-0000-0000-0000-0000000000c5', 'admin'),
  ('00000000-0000-0000-0000-0000000000c5', 'cms.website'),
  ('00000000-0000-0000-0000-0000000000c6', 'cms.website');
insert into auth.sessions (id, user_id) select ('10000000-0000-0000-0000-0000000000' || right(user_id::text, 2))::uuid, user_id
  from public.members where user_id::text like '00000000-0000-0000-0000-0000000000c_' and right(user_id::text, 2) in ('c1', 'c2', 'c5', 'c6');
insert into public.verified_sessions (session_id, user_id, method)
  select id, user_id, 'code' from auth.sessions where user_id::text like '00000000-0000-0000-0000-0000000000c_' and right(user_id::text, 2) in ('c1', 'c2', 'c6');

create function pg_temp.as_user(n text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', '00000000-0000-0000-0000-0000000000' || n,
    'session_id', '10000000-0000-0000-0000-0000000000' || n,
    'role', 'authenticated', 'email', 'x@example.test')::text, true);
  set local role authenticated;
end $$;

-- Rows an update touches, with the caller's rights (RLS hides rows instead of raising an error).
create function pg_temp.rows_updated(q text) returns int language plpgsql as $$
declare n int;
begin execute q; get diagnostics n = row_count; return n; end $$;

-- Content fixtures (as postgres, so RLS does not apply): two seasons, one of them current; a topic, a social link, a card.
update public.seasons set current = false where current;
insert into public.seasons (id, game, years, ftc, current) values
  ('test-new', 'Test Game', '2098–99', 2098, true),
  ('test-old', 'Older Game', '2097–98', 2097, false);
insert into public.blog_topics (id, slug, name) values ('fixture', 'fixture', '{"en":"Fixture","ro":"Fixture"}');
insert into public.social_links (network, url, sort) values ('github', 'https://github.com/example', 0)
  on conflict (network) do update set sort = 0;
insert into public.link_cards (title, url) values ('Fixture card', 'https://example.test');
insert into public.short_urls (slug, url) values ('fixture-link', 'https://example.test');
insert into public.publish_runs (targets, state, started_at, finished_at, duration_sec)
  values ('{website,links}', 'live', now() - interval '1 hour', now() - interval '59 minutes', 70);

-- ── constraints (as the table owner) ──
select throws_ok($$insert into public.short_urls (slug, url) values ('en', 'https://example.test')$$, '23514', null, 'short URL: "en" is reserved');
select throws_ok($$insert into public.short_urls (slug, url) values ('ro', 'https://example.test')$$, '23514', null, 'short URL: "ro" is reserved');
select throws_ok($$insert into public.short_urls (slug, url) values ('despre', 'https://example.test')$$, '23514', null, 'short URL: a Romanian page route is reserved');
select throws_ok($$insert into public.short_urls (slug, url) values ('blog', 'https://example.test')$$, '23514', null, 'short URL: an English page route is reserved');
select throws_ok($$insert into public.short_urls (slug, url) values ('Bad Slug', 'https://example.test')$$, '23514', null, 'short URL: slug must be kebab-case');
select throws_ok($$insert into public.short_urls (slug, url) values ('no-scheme', 'example.test')$$, '23514', null, 'short URL: destination must be http(s)');
select lives_ok($$insert into public.short_urls (slug, url) values ('docs-test', 'https://docs.example.test')$$, 'short URL: a free slug is accepted');
select throws_ok($$insert into public.seasons (id, game, years, current) values ('test-other', 'X', '2099–00', true)$$,
  '23505', null, 'seasons: a second current season is rejected');
select throws_ok($$insert into public.blog_posts (slug, title, excerpt, status, published_at)
  values ('half', '{"en":"Only English","ro":""}', '{"en":"a","ro":"b"}', 'published', now())$$,
  '23514', null, 'blog: a published post needs both languages');
select throws_ok($$insert into public.blog_posts (slug, title, excerpt, topics)
  values ('bad-tag', '{"en":"a","ro":"b"}', '{"en":"a","ro":"b"}', array['no-such-topic'])$$,
  '23503', 'Unknown topic on this post.', 'blog: unknown topic id is rejected');
select lives_ok($$insert into public.blog_posts (slug, title, excerpt, topics, season_id)
  values ('tagged', '{"en":"a","ro":"b"}', '{"en":"a","ro":"b"}', array['fixture'], 'test-new')$$, 'blog: a draft with a known topic and one season');
select throws_ok($$insert into public.gallery_items (kind, width, height) values ('photo', 10, 10)$$, '23514', null, 'gallery: a photo needs a key');

-- ── unverified session (admin + cms.website, but no verified_sessions row) ──
select pg_temp.as_user('c5');
select is((select count(*) from public.seasons)::int, 0, 'unverified: seasons empty');
select is((select count(*) from public.blog_posts)::int + (select count(*) from public.short_urls)::int
  + (select count(*) from public.link_cards)::int, 0, 'unverified: posts, short URLs and cards empty');
select throws_ok($$insert into public.blog_topics (id, slug, name) values ('x', 'x', '{"en":"x","ro":"x"}')$$, '42501', null, 'unverified: cannot write');
reset role;

-- ── admin without cms.* ──
select pg_temp.as_user('c1');
select is((select count(*) from public.seasons)::int + (select count(*) from public.social_links)::int, 0, 'admin only: no reference reads');
select is((select count(*) from public.blog_topics)::int + (select count(*) from public.projects)::int
  + (select count(*) from public.site_settings)::int + (select count(*) from public.short_urls)::int
  + (select count(*) from public.link_cards)::int, 0, 'admin only: reads no content');
reset role;

-- ── the API roles start with nothing ──
set local role anon;
select throws_ok($$select count(*) from public.blog_posts$$, '42501', null, 'anon: no access to content');
select throws_ok($$select count(*) from public.season_summaries$$, '42501', null, 'anon: no access to the season view');
reset role;

-- ── cms.links ──
select pg_temp.as_user('c2');
select throws_ok($$insert into public.blog_posts (slug, title, excerpt) values ('nope', '{"en":"a","ro":"b"}', '{"en":"a","ro":"b"}')$$,
  '42501', null, 'cms.links: cannot write blog_posts');
select is((select count(*) from public.blog_posts)::int, 0, 'cms.links: cannot read blog_posts');
select lives_ok($$insert into public.short_urls (slug, url) values ('from-links', 'https://example.test/links')$$, 'cms.links: can write short_urls');
select lives_ok($$insert into public.link_cards (title, url) values ('Mine', 'https://example.test')$$, 'cms.links: can write link_cards');
select ok((select count(*) from public.seasons) >= 2, 'cms.links: can read seasons (pickers)');
select is((select id from public.season_summaries limit 1), 'test-new', 'season view: newest first');
select is((select count(*) from public.social_links)::int > 0, true, 'cms.links: can read social links');
select lives_ok($$select public.reorder_socials(array['github'])$$, 'cms.links: can reorder social links');
select is(pg_temp.rows_updated($q$update public.social_links set url = 'https://evil.example'$q$), 0,
  'cms.links: cannot edit a social link directly');
select is(pg_temp.rows_updated($q$update public.seasons set game = 'Hacked'$q$), 0, 'cms.links: cannot edit seasons');
reset role;

-- ── cms.website ──
select pg_temp.as_user('c6');
select throws_ok($$insert into public.link_cards (title, url) values ('Nope', 'https://example.test')$$, '42501', null, 'cms.website: cannot write link_cards');
select throws_ok($$insert into public.short_urls (slug, url) values ('nope-too', 'https://example.test')$$, '42501', null, 'cms.website: cannot write short_urls');
select is((select count(*) from public.link_cards)::int, 0, 'cms.website: cannot read link_cards');
create temp table pg_temp.waiting as select (public.publish_status() #>> '{waiting,website}')::int as n;
select lives_ok($$insert into public.blog_topics (id, slug, name) values ('audited', 'audited', '{"en":"Audited topic","ro":"Subiect"}')$$,
  'cms.website: can write blog_topics');
select is((select updated_by from public.blog_topics where id = 'audited'), '00000000-0000-0000-0000-0000000000c6'::uuid, 'stamp: updated_by is the member');
select is((public.publish_status() #>> '{waiting,website}')::int, (select n + 1 from pg_temp.waiting), 'publish_status: waiting.website counts the edit');
select lives_ok($$select public.set_current_season('test-old')$$, 'cms.website: can switch the current season');
select is((select array_agg(id order by id) from public.seasons where current), array['test-old'], 'exactly one current season after switching');
reset role;

-- ── audit rows written by those edits ──
select is((select item from public.audit_log where table_name = 'blog_topics' and row_id = 'audited'), 'Audited topic', 'audit: item is name.en');
select is((select actor_email from public.audit_log where table_name = 'blog_topics' and row_id = 'audited'), 'website@example.test', 'audit: actor email');
select is((select item from public.audit_log where table_name = 'short_urls' and row_id = 'from-links'), 'from-links', 'audit: short URL item is the slug');

-- Deleting a topic takes it off the posts that carry it.
delete from public.blog_topics where id = 'fixture';
select is((select topics from public.blog_posts where slug = 'tagged'), '{}'::text[], 'blog: deleting a topic removes it from posts');

select * from finish();
rollback;
