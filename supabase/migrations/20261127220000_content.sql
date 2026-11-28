-- Content tables for the CMS (docs/backend.md §4 and §8 "Content").
-- One table per record type a CMS module edits. Columns follow the TypeScript types in apps/cms/src/modules/*/data/types.ts
-- (snake_case here, camelCase there). Bilingual text is jsonb {en, ro}; media columns hold CDN keys (CLAUDE.md §11).
-- Every table gets created_at/created_by/updated_at/updated_by (stamped by trigger), the audit trigger, RLS, and its
-- publish target(s). The API roles start with nothing and get back only what a policy uses.

-- ───────────────────────── helpers for constraints ─────────────────────────

-- {en: text, ro: text}. Empty strings are allowed (a draft); the CMS blocks publishing when one is missing.
create function public.is_bilingual(v jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(v) = 'object'
    and jsonb_typeof(v -> 'en') = 'string' and jsonb_typeof(v -> 'ro') = 'string', false);
$$;

-- ───────────────────────── seasons ─────────────────────────

create table public.seasons (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),               -- CLAUDE.md §11 season slug
  game text not null check (btrim(game) <> ''),
  years text not null check (years ~ '^[0-9]{4}–[0-9]{2}$'),                  -- "2025–26" (en dash)
  start_year int generated always as ((substring(years from '^[0-9]{4}'))::int) stored,
  ftc int check (ftc is null or ftc between 2000 and 2100),                   -- FTC Events season code; null before 2020
  current boolean not null default false,
  game_logo text,
  team_photo text,
  robot text,
  onshape text not null default '',
  portfolio_pdf text,
  portfolio_cover text
);
-- At most one current season. set_current_season() switches it without a window with two.
create unique index seasons_one_current on public.seasons (current) where current;

-- A custom rank/result an editor set on an imported (FTC Events) event, keyed by the season and the event code.
create table public.season_event_overrides (
  season_id text not null references public.seasons (id) on update cascade on delete cascade,
  code text not null check (btrim(code) <> ''),
  rank int check (rank is null or rank >= 1),
  result jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(result)),
  note text not null default '',
  primary key (season_id, code)
);

-- Events that are not on FTC Events (offseason cups…). The website's Season.extraEvents.
create table public.season_events (
  id uuid primary key default gen_random_uuid(),
  season_id text not null references public.seasons (id) on update cascade on delete cascade,
  name jsonb not null check (public.is_bilingual(name)),
  date text not null check (date ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),      -- YYYY-MM-DD, YYYY-MM or YYYY
  place jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(place)),
  place_url text not null default '' check (place_url = '' or place_url ~ '^https?://'),
  result jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(result))
);
create index season_events_season_idx on public.season_events (season_id);

-- Awards are always managed here (they need translations).
create table public.awards (
  id uuid primary key default gen_random_uuid(),
  season_id text not null references public.seasons (id) on update cascade on delete cascade,
  name jsonb not null check (public.is_bilingual(name)),
  event jsonb not null check (public.is_bilingual(event)),
  event_code text,                                                            -- won at an imported event
  extra_id uuid references public.season_events (id) on delete set null,       -- won at an extra event
  type text,
  check (event_code is null or extra_id is null)
);
create index awards_season_idx on public.awards (season_id);

-- ───────────────────────── projects (also the BrickLog project tags) ─────────────────────────

create table public.projects (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),                -- equals the slug at creation
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_bilingual(name)),
  summary jsonb not null check (public.is_bilingual(summary)),
  logo text,
  external text check (external is null or external ~ '^https?://'),
  stats jsonb not null default '[]' check (jsonb_typeof(stats) = 'array' and jsonb_array_length(stats) <= 4),
  body jsonb not null default '{"en":[],"ro":[]}'
    check (jsonb_typeof(body -> 'en') = 'array' and jsonb_typeof(body -> 'ro') = 'array'),
  facts jsonb not null default '[]' check (jsonb_typeof(facts) = 'array'),
  photos jsonb not null default '[]' check (jsonb_typeof(photos) = 'array'),
  partners jsonb not null default '[]' check (jsonb_typeof(partners) = 'array'),
  sort int not null default 0
);

-- ───────────────────────── blog ─────────────────────────

create table public.blog_topics (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),                -- equals the slug at creation
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_bilingual(name)),
  sort int not null default 0
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null check (public.is_bilingual(title)),
  excerpt jsonb not null check (public.is_bilingual(excerpt)),
  body jsonb not null default '{"en":{"type":"doc","content":[{"type":"paragraph"}]},"ro":{"type":"doc","content":[{"type":"paragraph"}]}}'
    check (jsonb_typeof(body -> 'en') = 'object' and jsonb_typeof(body -> 'ro') = 'object'),   -- Tiptap JSON per language
  cover text,
  topics text[] not null default '{}',                                         -- blog_topics.id, checked by trigger
  projects text[] not null default '{}',                                       -- projects.id, checked by trigger
  season_id text references public.seasons (id) on update cascade on delete set null,   -- at most one season
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  publish_at timestamptz,
  published_at timestamptz,
  seo jsonb not null default '{"title":{"en":"","ro":""},"description":{"en":"","ro":""}}'
    check (public.is_bilingual(seo -> 'title') and public.is_bilingual(seo -> 'description')),
  constraint blog_posts_schedule check (status <> 'scheduled' or publish_at is not null),
  constraint blog_posts_published check (status <> 'published' or published_at is not null),
  -- A post that is live or scheduled has its title and excerpt in both languages (CLAUDE.md §3: bilingual before publish).
  constraint blog_posts_bilingual_ready check (status = 'draft' or (
    btrim(title ->> 'en') <> '' and btrim(title ->> 'ro') <> ''
    and btrim(excerpt ->> 'en') <> '' and btrim(excerpt ->> 'ro') <> ''))
);
create index blog_posts_status_idx on public.blog_posts (status, published_at desc);
create index blog_posts_season_idx on public.blog_posts (season_id);

-- A post's topic and project ids must exist.
create function public.blog_posts_check_tags() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from unnest(new.topics) t where not exists (select 1 from public.blog_topics b where b.id = t)) then
    raise exception 'Unknown topic on this post.' using errcode = '23503';
  end if;
  if exists (select 1 from unnest(new.projects) p where not exists (select 1 from public.projects x where x.id = p)) then
    raise exception 'Unknown project on this post.' using errcode = '23503';
  end if;
  return new;
end $$;
create trigger trg_blog_tags before insert or update of topics, projects on public.blog_posts
  for each row execute function public.blog_posts_check_tags();

-- Deleting a topic or a project takes it off every post that carries it.
create function public.blog_tag_removed() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'blog_topics' then
    update public.blog_posts set topics = array_remove(topics, old.id) where old.id = any (topics);
  else
    update public.blog_posts set projects = array_remove(projects, old.id) where old.id = any (projects);
  end if;
  return old;
end $$;
create trigger trg_blog_tag_removed before delete on public.blog_topics
  for each row execute function public.blog_tag_removed();
create trigger trg_blog_tag_removed before delete on public.projects
  for each row execute function public.blog_tag_removed();

-- ───────────────────────── team & story, join ─────────────────────────

create table public.timeline_milestones (
  id text primary key default gen_random_uuid()::text check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  occurred_on text not null check (occurred_on ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),   -- TS: `when`
  title jsonb not null check (public.is_bilingual(title)),
  text jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(text)),
  image text
);

-- Single row (id = 1). `label` is a constant that makes the audit log readable.
create table public.team_page (
  id int primary key default 1 check (id = 1),
  label text generated always as ('Team page') stored,
  mission jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(mission)),
  drive jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(drive)),
  "values" jsonb not null default '[]' check (jsonb_typeof("values") = 'array'),            -- [{name: Bilingual, line: Bilingual}]
  students_do jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(students_do)),
  team_photo text
);

-- The four fixed impact numbers; `value` is entered by hand (null until then).
create table public.impact_numbers (
  id text primary key check (id in ('years', 'awards', 'reached', 'events')),
  value int check (value is null or value >= 0),
  suffix text not null default '',
  label jsonb not null check (public.is_bilingual(label)),
  sort int not null default 0
);

create table public.join_page (
  id int primary key default 1 check (id = 1),
  label text generated always as ('Join page') stored,
  requirements jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(requirements))
);

create table public.departments (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),                -- also the CDN folder site/join/{id}/
  name jsonb not null check (public.is_bilingual(name)),
  description jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(description)),
  photos jsonb not null default '[]' check (jsonb_typeof(photos) = 'array'),   -- [{file, alt: Bilingual}]
  sort int not null default 0
);

-- ───────────────────────── gallery ─────────────────────────

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo', 'video', 'youtube')),
  key text,
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  width int not null check (width > 0),
  height int not null check (height > 0),
  season_id text references public.seasons (id) on update cascade on delete set null,   -- null = general
  date date,
  featured boolean not null default false,
  alt jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(alt)),
  caption jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(caption)),
  check ((kind = 'youtube' and youtube_id is not null and key is null) or (kind <> 'youtube' and key is not null and youtube_id is null))
);
create index gallery_items_season_idx on public.gallery_items (season_id);

-- ───────────────────────── support: sponsors, tiers, documents, budget ─────────────────────────

create table public.sponsor_tiers (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_bilingual(name)),
  amount int not null check (amount > 0),                                      -- EUR, "from"
  benefits int not null default 0 check (benefits >= 0),                       -- the first N benefits are included
  sort int not null default 0                                                  -- lowest tier first
);

-- The ordered, cumulative list of benefits.
create table public.sponsor_benefits (
  id uuid primary key default gen_random_uuid(),
  text jsonb not null check (public.is_bilingual(text)),
  sort int not null default 0
);

create table public.sponsors (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),                -- also the file name sponsors/{id}.*
  name text not null check (btrim(name) <> ''),
  logo text,
  website text not null default '' check (website = '' or website ~ '^https?://'),
  season_id text not null references public.seasons (id) on update cascade,
  tier_id text not null references public.sponsor_tiers (id) on update cascade on delete restrict   -- internal, never public
);
create index sponsors_season_idx on public.sponsors (season_id);

-- Single row: the sample contract and "how contracts work".
create table public.support_docs (
  id int primary key default 1 check (id = 1),
  label text generated always as ('Support documents') stored,
  contract text,                                                               -- documents/sample-contract.pdf
  contract_text jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(contract_text))
);

create table public.sponsor_decks (
  season_id text primary key references public.seasons (id) on update cascade on delete cascade,
  file text
);

-- Spending of one season in EUR; categories are free (budget_lines). `remaining` is the money left at the end.
create table public.season_budgets (
  season_id text primary key references public.seasons (id) on update cascade on delete cascade,
  remaining numeric(12, 2) not null default 0 check (remaining >= 0)
);
create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  season_id text not null references public.season_budgets (season_id) on update cascade on delete cascade,
  name jsonb not null check (public.is_bilingual(name)),
  amount numeric(12, 2) not null check (amount >= 0),
  sort int not null default 0
);
create index budget_lines_season_idx on public.budget_lines (season_id, sort);

-- ───────────────────────── home & FAQ, press, settings ─────────────────────────

create table public.home_hero (
  id int primary key default 1 check (id = 1),
  label text generated always as ('Home hero') stored,
  tagline jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(tagline)),
  intro jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(intro)),
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  media text,
  poster text
);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question jsonb not null check (public.is_bilingual(question)),
  answer jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(answer)),   -- Markdown
  sort int not null default 0
);

create table public.form230_callout (
  id int primary key default 1 check (id = 1),
  label text generated always as ('Form 230 callout') stored,
  starts_on date not null,
  ends_on date not null,
  text jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(text)),
  link text not null default '' check (link = '' or link ~ '^https?://'),
  check (ends_on >= starts_on)
);

create table public.press_kit (
  id int primary key default 1 check (id = 1),
  label text generated always as ('Press kit') stored,
  marks jsonb not null default '{}' check (jsonb_typeof(marks) = 'object'),      -- PressMarks
  photos jsonb not null default '[]' check (jsonb_typeof(photos) = 'array'),     -- [{id, kind, file, alt}]
  short_description jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(short_description)),
  long_description jsonb not null default '{"en":"","ro":""}' check (public.is_bilingual(long_description)),
  contact_email text not null default 'contact@brickbot.ro' check (position('@' in contact_email) > 1)
);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  email text not null check (position('@' in email) > 1),                       -- the only public address
  address jsonb not null check (public.is_bilingual(address)),
  maps_embed text not null default '' check (maps_embed = '' or maps_embed ~ '^https://'),
  maps_link text not null default '' check (maps_link = '' or maps_link ~ '^https://'),
  association_name text not null,
  cif text not null check (cif ~ '^[0-9]+$'),
  bank text not null,
  branch jsonb not null check (public.is_bilingual(branch)),
  iban text not null check (iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$')
);

-- Shared by the website (footer, contact) and the links page. List order is icon order.
create table public.social_links (
  network text primary key check (network in ('website', 'instagram', 'facebook', 'tiktok', 'linkedin', 'email', 'youtube', 'github')),
  url text not null check (url ~ '^(https?://|mailto:)'),
  sort int not null default 0
);

-- ───────────────────────── linktree and short URLs ─────────────────────────

create table public.link_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  display_url text not null default '',
  url text not null check (url ~ '^https?://'),
  icon text,
  highlighted boolean not null default false,
  starts_on date,
  ends_on date,
  sort int not null default 0,
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

-- brickbot.ro/<slug>. Reserved: the language prefixes, the website's page routes (CLAUDE.md §3 sitemap, both languages),
-- the legacy redirects of §3.12 and files the build produces. Keep in step with apps/cms/src/modules/short-urls/reserved.ts.
create table public.short_urls (
  slug text primary key
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60)
    constraint short_urls_slug_not_reserved check (slug <> all (array[
      'en', 'ro',
      'about', 'despre', 'team', 'echipa', 'gallery', 'galerie', 'seasons', 'sezoane', 'projects', 'proiecte', 'blog',
      'join', 'alatura-te', 'partners', 'parteneri', 'donate', 'doneaza', 'sponsors', 'sponsori', 'press', 'presa',
      'contact', 'terms', 'termeni-si-conditii', 'privacy', 'politica-de-confidentialitate',
      'sitemap', 'sitemap-index', 'robots', '404', 'preview'])),
  url text not null check (url ~ '^https?://[^[:space:]]+$')
);

-- ───────────────────────── audit columns, triggers, publish targets ─────────────────────────

do $$
declare
  t text;
  website text[] := array[
    'seasons', 'season_event_overrides', 'season_events', 'awards', 'projects', 'blog_topics', 'blog_posts',
    'timeline_milestones', 'team_page', 'impact_numbers', 'join_page', 'departments', 'gallery_items',
    'sponsor_tiers', 'sponsor_benefits', 'sponsors', 'support_docs', 'sponsor_decks', 'season_budgets', 'budget_lines',
    'home_hero', 'faq_items', 'form230_callout', 'press_kit', 'site_settings', 'social_links', 'short_urls'];
  links text[] := array['link_cards', 'social_links', 'short_urls'];
begin
  foreach t in array website || array['link_cards'] loop
    execute format($f$
      alter table public.%I
        add column created_at timestamptz not null default now(),
        add column created_by uuid references public.members (user_id) on delete set null,
        add column updated_at timestamptz not null default now(),
        add column updated_by uuid references public.members (user_id) on delete set null$f$, t);
  end loop;
  foreach t in array website loop
    perform public.enable_content(format('public.%I', t)::regclass, 'website');
  end loop;
  foreach t in array links loop
    perform public.enable_content(format('public.%I', t)::regclass, 'links');
  end loop;
end $$;

-- ───────────────────────── rpc ─────────────────────────

-- Makes one season the current one (the previous stops being current). Runs with the caller's rights, so RLS applies.
create function public.set_current_season(p_id text) returns void
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.seasons where id = p_id) then
    raise exception 'unknown season' using errcode = 'P0002';
  end if;
  update public.seasons set current = false where current and id <> p_id;
  update public.seasons set current = true where id = p_id and not current;
end $$;

-- Puts the social links in this order; networks not listed keep their relative place after the listed ones.
-- Security definer because the Linktree module (cms.links) may reorder icons that Site settings (cms.website) owns.
create function public.reorder_socials(p_order text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_any_cms() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.social_links s
  set sort = coalesce((select o.ord::int from unnest(p_order) with ordinality o (n, ord) where o.n = s.network), 1000 + s.sort);
end $$;

-- The CMS's listSeasons(): SeasonSummary, newest first. Reads through the caller's rights (any CMS member).
create view public.season_summaries with (security_invoker = true) as
  select id, game, years, current from public.seasons order by start_year desc;

-- ───────────────────────── privileges and policies ─────────────────────────

do $$
declare
  t text;
  website text[] := array[
    'seasons', 'season_event_overrides', 'season_events', 'awards', 'projects', 'blog_topics', 'blog_posts',
    'timeline_milestones', 'team_page', 'impact_numbers', 'join_page', 'departments', 'gallery_items',
    'sponsor_tiers', 'sponsor_benefits', 'sponsors', 'support_docs', 'sponsor_decks', 'season_budgets', 'budget_lines',
    'home_hero', 'faq_items', 'form230_callout', 'press_kit', 'site_settings', 'social_links'];
  links text[] := array['link_cards', 'short_urls'];
  shared_read text[] := array['seasons', 'social_links'];   -- pickers and the Linktree read these from any CMS module
begin
  foreach t in array website || links loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
  foreach t in array website loop
    execute format('create policy %I on public.%I for all to authenticated using (public.has_permission(%L)) with check (public.has_permission(%L))',
      t || '_website', t, 'cms.website', 'cms.website');
  end loop;
  foreach t in array links loop
    execute format('create policy %I on public.%I for all to authenticated using (public.has_permission(%L)) with check (public.has_permission(%L))',
      t || '_links', t, 'cms.links', 'cms.links');
  end loop;
  foreach t in array shared_read loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_any_cms())', t || '_read', t);
  end loop;
end $$;

revoke all on public.season_summaries from anon, authenticated;
grant select on public.season_summaries to authenticated;

-- Functions: nobody by default; then only who needs them. The trigger functions are never called directly.
revoke execute on function public.set_current_season(text), public.reorder_socials(text[]),
  public.blog_posts_check_tags(), public.blog_tag_removed() from public, anon, authenticated;
grant execute on function public.set_current_season(text), public.reorder_socials(text[]) to authenticated, service_role;
