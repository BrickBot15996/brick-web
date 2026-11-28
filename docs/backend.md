# Backend contract (Supabase)

The single source of truth for how the database, the Edge Functions, `packages/supabase`, auth and the CMS fit together.
Read it before touching any of them. Agents **add** to the sections marked *(filled by …)*; changing a decided rule
needs the lead's approval (say so in your report instead).

Root `CLAUDE.md` §2, §5, §6 and §11 are the requirements; `apps/cms/PRODUCT.md` holds the product rules (accounts are
emails only, never names).

---

## 1. Layout

```
supabase/
  config.toml                local stack config (auth URLs, hook, email templates, functions)
  migrations/                timestamped SQL, applied in order (`supabase db reset` locally, `supabase db push` in prod)
  seed.sql                   real starting content only (no sample data, no users); pushed once with --include-seed
  tests/                     pgTAP RLS tests (`supabase test db`)
  templates/                 auth email templates (invite, recovery)
  functions/
    _shared/                 cors, auth guard, json helpers, R2 signing, email sending
    email-2fa/  admin-users/  media/  publish/
packages/supabase/           @brickbot/supabase: browser client, cookie session, generated DB types
scripts/                     local helpers (bootstrap-admin, dev-user)
```

## 2. Environments

| | Supabase API | Apps |
|---|---|---|
| Local | `supabase start` → `http://127.0.0.1:54321`, Studio `:54323`, Mailpit `:54324` | cms `http://127.0.0.1:5173`, auth `http://127.0.0.1:5174` |
| Production | `SUPABASE_URL` | `cms.brickbot.ro`, `auth.brickbot.ro` |

- Vite configs map `SUPABASE_DEV_URL` / `SUPABASE_DEV_ANON_KEY` over `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `vite dev`
  when they are set, so local dev talks to the local stack. The local anon key is the CLI's public demo key, not a secret.
- `CMS_PREVIEW=true` / `AUTH_PREVIEW=true` keep the in-memory preview implementations. Live code is used when they are off.
- Never print, log or commit a `[SECRET]` value. The service role key exists only in Edge Function secrets and in local
  scripts run by the owner.

## 3. Identity, sessions and permissions

- **Accounts are emails only.** No names, avatars or profiles anywhere.
- `public.members` mirrors `auth.users` (trigger on `auth.users`): `user_id`, `email`, `invited_at`, `invited_by`,
  `last_sign_in_at`, `deactivated_at`. Status: `deactivated` if `deactivated_at`, else `invited` if never signed in,
  else `active`.
- `public.permissions` (catalog: `id`, `label`, `description`, `sort`) and `public.user_permissions`
  (`user_id`, `permission`, `granted_at`, `granted_by`). Initial ids: `cms.website`, `cms.links`, `admin`.
- **Custom access token hook** `public.custom_access_token_hook(event jsonb)` adds a top-level `permissions` claim
  (text array) to every JWT. It is for UI gating only.
- **RLS never trusts the JWT's permissions claim.** It calls these `security definer` helpers, which read the tables, so
  a revoked permission or a deactivation takes effect immediately:
  - `public.is_member()`: the caller is a member, not deactivated, **and their current session passed the email second
    factor** (a row in `public.verified_sessions` for `auth.jwt()->>'session_id'`).
  - `public.has_permission(p text)`: `is_member()` and holds `p`.
  - `public.has_any_cms()`: holds `cms.website` or `cms.links`.
- **Email second factor (CLAUDE.md §6).** After a password sign-in the session exists but `is_member()` is false until
  the `email-2fa` function verifies it: either a valid trusted-device token (30 days) or a correct 6-digit code. Sessions
  created from an invite or recovery link (the inbox is proven) are verified on `start` without a code. Tables
  `public.verified_sessions`, `public.trusted_devices`, `public.email_codes` have RLS on and **no policies** (service role
  only); codes and device tokens are stored as SHA-256 hashes.
- `public.my_session()` (rpc, any signed-in user): `{ email, permissions, verified }` for the caller. Apps use it for
  gating instead of decoding the JWT.
- Deactivation: ban in Auth, set `deactivated_at`, delete the user's `verified_sessions` and `trusted_devices`. Never
  delete the user (authorship history stays).
- **Single sign-on:** `@brickbot/supabase` stores the session in cookies. On `*.brickbot.ro` the cookie domain is
  `.brickbot.ro` (decided at runtime from `location.hostname`); on `127.0.0.1` it is host-only, which is still shared
  across ports. The CMS sends visitors without a verified session to `${AUTH_URL}?redirect=<url>`.

## 4. Content tables (conventions)

- Every table lives in `public`, has **RLS enabled**, and gets policies. No table is left open.
- Website content: all four actions need `has_permission('cms.website')`. Linktree and short URLs: `cms.links`.
  Shared reference reads (e.g. seasons for pickers, social links) may allow any `has_any_cms()`.
- No anon access yet. How the website and links builds read content is decided later (packages/content).
- Bilingual text is `jsonb` `{ "en": "...", "ro": "..." }`. The linktree is English only (plain text).
- Columns for anything filtered, sorted or unique (`slug`, `season_id`, `status`, `sort`); `jsonb` for nested lists that
  are always edited as a whole.
- Every content table has `created_at`, `created_by`, `updated_at`, `updated_by` (uuid → `members.user_id`), set by
  trigger, and is registered with `select public.enable_content('public.<table>')`, which attaches the stamp trigger and
  the audit trigger.
- Media references store the **CDN key** (CLAUDE.md §11), never a full URL.

## 5. Audit log and activity

- `public.audit_log`: `id`, `at`, `actor_id`, `actor_email`, `table_name`, `row_id`, `action` (`insert|update|delete`),
  `item` (readable name), `before`, `after` (`jsonb`). Written only by the `public.audit_row()` trigger. Select:
  `has_permission('admin')`. Nobody can update or delete rows.
- `item` is the first non-empty of: `title.en`, `title`, `name.en`, `name`, `label.en`, `label`, `slug`, `email`, `key`,
  the row id.
- `public.activity`: the home feed's "Lately on the team". Rows are written by the CMS after each successful mutation
  (`action`, `target_label`, `detail`, `module`, `href`); `actor_id` defaults to `auth.uid()` and a policy forces it to
  equal `auth.uid()`; `actor_email` is filled by trigger. Insert/select: `has_any_cms() or has_permission('admin')`.
  The audit log stays the authoritative record; activity is the readable summary.

## 6. Media

- `public.media`: `key` (pk, base key for CMS rasters), `kind`, `folder`, `size`, `width`, `height`, `widths int[]`,
  `poster`, `uploaded_by`, `uploaded_at`. Select/insert: `has_any_cms()`. Delete: only through the `media` function
  (which also deletes the R2 objects).
- Upload flow: the browser prepares objects (`apps/cms/src/lib/data/media-upload.ts`), asks the `media` function for
  presigned PUT URLs (it checks `has_any_cms()` and that every key is under an allowed §11 folder and well formed),
  PUTs each object straight to R2, then inserts the `media` row.
- Files uploaded by hand before the CMS existed are seeded as `media` rows with no `widths`.

## 7. Edge Functions

All functions: CORS for the app origins (`CMS_URL`, `AUTH_URL`, and `http://127.0.0.1:5173|5174` locally), JSON in and
out, the caller's JWT from `Authorization`, and errors as `{ error: { code, message } }` with a message safe to show.

| Function | Who | Actions |
|---|---|---|
| `email-2fa` | any signed-in user | `start {deviceToken?}` → `{status: 'verified' \| 'code-sent'}`; `send` (resend, rate limited); `verify {code}` → `{deviceToken, expiresAt}` |
| `admin-users` | `admin` | `list`, `invite {email, permissions}`, `resend {userId}`, `deactivate {userId}`, `reactivate {userId}`, `setPermissions {userId, permissions}` |
| `media` | any `cms.*` | `sign {objects: [{key, contentType, size}]}` → presigned PUT URLs; `delete {key}` |
| `publish` | any `cms.*` | `publish {targets}`; `status`. **Deferred**: not written yet (the website doesn't read from the database yet) |

Secrets (Supabase → Edge Functions → Secrets): `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_S3_ENDPOINT`,
`R2_BUCKET_NAME`, `RESEND_API_KEY`, `AUTH_URL`, `CMS_URL`, `DEPLOY_HOOK_WEBSITE`, `DEPLOY_HOOK_LINKS`, `EMAIL_FROM`.
Locally `EMAIL_MODE=log` prints codes to the function log instead of sending.

---

## 8. Tables *(filled by the database agents)*

### Core (`supabase/migrations/20261127210000_core.sql`)

RLS is on for every table; the API roles start with no privileges and get back only what a policy uses.

| Table | Purpose | Access |
|---|---|---|
| `members` | Mirror of `auth.users` (`user_id`, `email`, `invited_at`, `invited_by`, `last_sign_in_at`, `deactivated_at`), filled by a trigger on `auth.users`. `email` is set once, at invite/creation, and never follows a later change of the Auth email (only `last_sign_in_at` syncs); it is the address second-factor codes go to | select: `has_any_cms()` or `admin`; writes: service role |
| `permissions` | Catalog (`id`, `label`, `description`, `sort`), seeded with `cms.website`, `cms.links`, `admin` | select: any verified member |
| `user_permissions` | `(user_id, permission)` grants with `granted_at/by` | select: own rows, or all for `admin` (plus `supabase_auth_admin` for the hook); writes: service role |
| `verified_sessions` | Sessions that passed the email second factor (`session_id` → `auth.sessions`, cascade) | service role only |
| `trusted_devices` | Hashed 30-day device tokens | service role only |
| `email_codes` | Hashed 6-digit codes with `expires_at`, `attempts`, `consumed_at` | service role only |
| `audit_log` | Append-only change record (§5). A trigger rejects update/delete even for the owner | select: `admin`; written by `audit_row()` |
| `activity` | "Lately on the team" feed (§5) | select/insert: `has_any_cms()` or `admin`; insert forced to `actor_id = auth.uid()` |
| `media` | One row per CDN file (§6); inserts must have `uploaded_by = auth.uid()` | select/insert: `has_any_cms()`; delete: service role |
| `publish_runs` | `id`, `targets text[]`, `state` building/live/failed, `started_at`, `finished_at`, `started_by`, `duration_sec` | select: `has_any_cms()`; writes: service role (publish function) |
| `publish_tables` | Registry of which content tables feed which site (`table_name`, `target`) | service role only |

### Functions defined by the core migration

| Function | Notes |
|---|---|
| `is_member()`, `has_permission(p)`, `has_any_cms()` | Policy helpers (§3). `security definer`, read tables only |
| `my_session()` | rpc `{ email, permissions, verified }`; permissions are `[]` until the session is verified |
| `custom_access_token_hook(event)` | Adds the `permissions` claim. Executable by `supabase_auth_admin` only |
| `set_permissions(user, perms[], actor)` | Service role only. Replaces a member's permissions atomically; `actor` is recorded in the audit log |
| `audit_row()` | Generic audit trigger. Trigger arguments name columns whose sole change is not logged. Actor is `auth.uid()`, else the `app.actor_id` setting (set by `set_permissions`) |
| `stamp_edited()` | Sets `created_*` / `updated_*`; columns a table lacks are ignored |
| `enable_content(tbl, publish_target default null)` | Service/migration only. Enables RLS, attaches `trg_stamp_edited` and `trg_audit`, and registers the table for `'website'` or `'links'` |
| `publish_status()` | rpc returning the `PublishStatus` shape. Needs `has_any_cms()` |

### How a content migration plugs in

```sql
create table public.blog_posts ( ... created_at timestamptz, created_by uuid references public.members (user_id),
                                 updated_at timestamptz, updated_by uuid references public.members (user_id) );
select public.enable_content('public.blog_posts', 'website');   -- 'links' for linktree and short URLs
create policy ... using (public.has_permission('cms.website'));
```

- A table feeding both sites is registered twice: `select public.enable_content('public.site_settings', 'website'); insert into public.publish_tables values ('site_settings', 'links');`.
- `publish_status().waiting` counts audit rows of registered tables newer than the start of the last live run of each target. Tables that are not registered (activity, media, members, permissions) never count.
- A run left in `building` for more than 15 minutes is reported as `failed`.
- `audit_log.item` for a table with `user_id` and no name column is the member's email (so permission rows read as emails).

### Content (`supabase/migrations/20261127220000_content.sql`)

Every table below has the four `created_at/created_by/updated_at/updated_by` columns (stamped by trigger; `*_by` → `members.user_id`), the audit trigger, RLS, and is registered for the publish target shown. Policy shorthand: **W** = all actions need `has_permission('cms.website')`, **L** = `cms.links`, **+read** = also readable by `has_any_cms()`. `anon` has no access to anything. Seed: `supabase/seed.sql`, generated by `node scripts/gen-seed.mjs` (see its header for sources).

| Table | Summary | Backs (module / type) | Permission | Publish |
|---|---|---|---|---|
| `seasons` | One row per season; `id` is the §11 slug; partial unique index = at most one `current`; generated `start_year` | seasons / `SeasonRecord` | W +read | website |
| `season_event_overrides` | Custom rank/result on an imported event; pk `(season_id, code)` | seasons / `EventOverride` | W | website |
| `season_events` | Extra events not on FTC Events (`Season.extraEvents`) | seasons / `ExtraEvent` | W | website |
| `awards` | Awards of every season (bilingual) | seasons / `Award` | W | website |
| `projects` | Projects = BrickLog project tags; `id` = slug at creation, unique `slug`, `sort` | projects / `Project` | W | website |
| `blog_topics` | Topic list (`id` = slug at creation), `sort` | blog / `Topic` | W | website |
| `blog_posts` | Posts (Tiptap JSON per language), one optional `season_id`, `topics[]`/`projects[]` checked by trigger, status rules | blog / `Post` | W | website |
| `timeline_milestones` | Our Story timeline | team / `Milestone` | W | website |
| `team_page` | Single row: mission, drive, values, students do, team photo | team / `Mission` | W | website |
| `impact_numbers` | The four fixed numbers (`years`, `awards`, `reached`, `events`) | team / `Impact.numbers` | W | website |
| `join_page` | Single row: requirements | team / `JoinPage.requirements` | W | website |
| `departments` | Join page departments, `sort` | team / `Department` | W | website |
| `gallery_items` | Photos, clips, YouTube embeds | gallery / `GalleryItem` | W | website |
| `sponsor_tiers` | Tiers (`name` bilingual, EUR `amount`, cumulative `benefits` count, `sort`); a tier with sponsors cannot be deleted | support / `TierDef` | W | website |
| `sponsor_benefits` | The ordered benefit list | support / `Benefit` | W | website |
| `sponsors` | Sponsors of a season; `tier_id` internal only | support / `Sponsor` | W | website |
| `support_docs` | Single row: sample contract key, "how contracts work" | support / `SupportDocs` | W | website |
| `sponsor_decks` | Sponsor deck PDF per season | support / `SponsorDeck` | W | website |
| `season_budgets` | `remaining` EUR per season | support / `SeasonBudget` | W | website |
| `budget_lines` | Spending categories of a season (`sort`) | support / `BudgetCategory` | W | website |
| `home_hero` | Single row: tagline, intro, hero media | home-faq / `Hero` | W | website |
| `faq_items` | FAQ, `sort` | home-faq / `Faq` | W | website |
| `form230_callout` | Single row: callout window, text, link | home-faq / `Form230` | W | website |
| `press_kit` | Single row: marks, photos, descriptions, contact email | press / `PressKit` | W | website |
| `site_settings` | Single row: email, address, maps, association | settings / `SiteSettings` | W | website |
| `social_links` | One row per network, `sort` = icon order; shared by both sites | settings + linktree / `SocialLink` | W +read (reorder through `reorder_socials`) | website + links |
| `link_cards` | Linktree cards, `sort` | linktree / `LinkCard` | L | links |
| `short_urls` | `brickbot.ro/<slug>` redirects; `slug` is the pk | short-urls / `ShortUrl` | L | links + website (`_redirects`) |

Single-row tables have `id int primary key default 1 check (id = 1)`: read with `.eq('id', 1).single()`, save with `upsert({ id: 1, … })`. Their generated `label` column ("Home hero", …) only makes audit rows readable; the CMS ignores it. `season_summaries` (view, caller's rights) is `listSeasons()`: `SeasonSummary`, newest first. Functions: `set_current_season(p_id)` (`setCurrent`), `reorder_socials(p_order text[])` (`reorderSocials`; any CMS member, because Linktree owns the order of icons that Site settings owns; its UPDATE carries a `WHERE` because PostgREST runs with pg-safeupdate, see `20261128000000_fix_reorder_socials.sql`).

Rules enforced by the database (surface the error message): kebab-case slugs on every slug/id; short URL slugs cannot be `en`, `ro`, a page route in either language, `sitemap`, `sitemap-index`, `robots`, `404`, `preview` (constraint `short_urls_slug_not_reserved`, same list as `apps/cms/src/modules/short-urls/reserved.ts`; the legacy `donate`/`doneaza`/`projects` are in it); http(s) targets; at most one current season (`23505`); a `scheduled`/`published` post needs title and excerpt in both languages (`23514`) and a `publish_at`/`published_at`; a post's topic/project ids must exist (`23503`) and deleting a topic or project removes it from every post; a post has one `season_id`. The "at least one topic to publish" rule stays in the CMS (so deleting a topic never fails on a published post).

**Type mapping** (TS camelCase ↔ column). Everywhere: `editedBy`/`editedAt` ↔ `updated_by` (email via the `members` embed) / `updated_at`; `createdBy`/`createdAt` ↔ `created_by`/`created_at`; `null` ↔ `null`; `Bilingual` ↔ jsonb `{en, ro}`. A record made of several rows (`TierPlan`, `SupportDocs`, `SeasonBudget`, `Impact`, socials) takes the latest `updated_at` of its rows as `Edited`. Fetch editors with `select('*, editor:members!updated_by(email)')` (members is readable by any CMS member).

- **blog**: `Post.id` ↔ `id`, `slug`, `title`, `excerpt`, `body` ↔ `body` (`{en: RichDoc, ro: RichDoc}`), `cover`, `topics`, `projects`, `season` ↔ `season_id`, `status`, `publishAt` ↔ `publish_at`, `publishedAt` ↔ `published_at`, `seo` ↔ `seo` (`{title, description}`). `Topic`: `id`, `slug`, `name`, `order` ↔ `sort`. `reorderTopics` = update `sort` by index.
- **seasons**: `SeasonRecord`: `id`, `game`, `years`, `ftc`, `current`, `gameLogo` ↔ `game_logo`, `teamPhoto` ↔ `team_photo`, `robot`, `onshape`, `portfolioPdf` ↔ `portfolio_pdf`, `portfolioCover` ↔ `portfolio_cover`. `EventOverride`: `season` ↔ `season_id`, `code`, `rank`, `result`, `note`. `ExtraEvent`: `id`, `season` ↔ `season_id`, `name`, `date`, `place`, `placeUrl` ↔ `place_url`, `result`. `Award`: `id`, `season` ↔ `season_id`, `name`, `event`, `eventCode` ↔ `event_code`, `extraId` ↔ `extra_id` (uuid of a `season_events` row), `type`. Imported events are not stored (FTC Events at build time). The seed's years use a plain en dash (the website's word joiners are display-only).
- **team**: `Milestone`: `id`, `when` ↔ `occurred_on` (`when` is an SQL keyword), `title`, `text`, `image`. `Mission`: `mission`, `drive`, `values` (jsonb `[{name, line}]`), `studentsDo` ↔ `students_do`, `teamPhoto` ↔ `team_photo`. `Impact.numbers` ↔ rows of `impact_numbers` ordered by `sort` (`id`, `value`, `suffix`, `label`). `JoinPage.requirements` ↔ `join_page.requirements`; `JoinPage.departments` ↔ `departments` (`id`, `name`, `description`, `photos` jsonb `[{file, alt}]`, order by `sort`); saving the page replaces the department rows.
- **gallery**: `id`, `kind`, `key`, `youtubeId` ↔ `youtube_id`, `width`, `height`, `season` ↔ `season_id`, `date` (`date`; `null` ↔ `null`, the seed uses the first of the month), `featured`, `alt`, `caption`.
- **projects**: `id`, `slug`, `name`, `summary`, `logo`, `external`, `stats` (jsonb `[{value, label}]`, at most 4), `body` (jsonb `{en: string[], ro: string[]}`), `facts`, `photos`, `partners` (jsonb arrays as the TS types), `order` ↔ `sort`.
- **support**: `Sponsor`: `id`, `name`, `logo`, `website` (`''` when none), `season` ↔ `season_id`, `tier` ↔ `tier_id`. `TierPlan.tiers` ↔ `sponsor_tiers` (`id`, `name`, `amount`, `benefits`, order by `sort`); `TierPlan.benefits` ↔ `sponsor_benefits` (`text` ↔ `Benefit.text`, order by `sort`); `listTiers()` = tiers with `name.en`. `SupportDocs.decks` ↔ `sponsor_decks` (`season` ↔ `season_id`, `file`); `contract`, `contractText` ↔ `contract_text`. `SeasonBudget`: `season` ↔ `season_id`, `remaining`, `categories` ↔ `budget_lines` (`id`, `name`, `amount`, order by `sort`); saving upserts the `season_budgets` row and replaces its lines. `numeric` columns come back as numbers.
- **home-faq**: `Hero`: `tagline`, `intro`, `mediaType` ↔ `media_type`, `media`, `poster`. `Faq`: `id`, `question`, `answer`, `order` ↔ `sort`. `Form230`: `start` ↔ `starts_on`, `end` ↔ `ends_on`, `text`, `link`. The seed dates the window for 2027 (start of year to 25 May); the owner rolls it forward each year.
- **press**: `PressKit`: `marks` (jsonb, exactly `PressMarks`), `photos` (jsonb `[{id, kind, file, alt}]`), `shortDescription` ↔ `short_description`, `longDescription` ↔ `long_description`, `contactEmail` ↔ `contact_email`.
- **settings**: `SiteSettings`: `email`, `address`, `mapsEmbed` ↔ `maps_embed`, `mapsLink` ↔ `maps_link`, `association` ↔ `{name: association_name, cif, bank, branch, iban}` (flat columns), `socials` ↔ `social_links` (`network`, `url`; order by `sort`; saving replaces the rows).
- **linktree**: `LinkCard`: `id`, `title`, `display` ↔ `display_url` (`''` ↔ `''`), `href` ↔ `url`, `icon`, `highlighted`, `start` ↔ `starts_on`, `end` ↔ `ends_on` (`''` ↔ `null`), list order ↔ `sort`. Saving the page replaces the card rows.
- **short-urls**: `ShortUrl`: `slug`, `to` ↔ `url`. Renaming = update `slug` (primary key).
- **audit labels** (`apps/cms/src/modules/audit/data/labels.ts`): table names are the ones above; add `season_event_overrides`, `blog_topics`, `timeline_milestones`, `departments`, `sponsor_tiers`, `sponsor_benefits`, `sponsor_decks`, `season_budgets`, `budget_lines`, `team_page`, `join_page`, `impact_numbers`, `support_docs`, `home_hero`, `form230_callout`, `press_kit`, `social_links` (`press_assets` is `press_kit`, `site_settings`/`faq_items`/`short_urls`/`link_cards`/`projects`/`gallery_items`/`sponsors`/`seasons`/`blog_posts` already match; the awards table is `awards`). Audit field names are the column names above (`starts_on`, `ends_on`, `display_url`, `url`, `cif`, `iban`, `address` already have labels).

## 9. Functions reference *(filled by the functions agent)*

Call as `POST ${SUPABASE_URL}/functions/v1/<name>` with `Authorization: Bearer <access token>`, `apikey: <anon key>` and a JSON
body `{ "action": "...", ...args }`. Success is the JSON result below. Failure is `{ "error": { "code", "message", "retryAfter"? } }`
with the HTTP status shown; `message` is plain and safe to show. A missing or invalid JWT is answered by the gateway itself
(401, shape `{ code, message }`, no `error` wrapper): treat any 401 as "sign in again".
Code: `supabase/functions/_shared/` (`http.ts` CORS + errors, `guard.ts` caller checks, `crypto.ts`, `email.ts`, `keys.ts`, `r2.ts`).
All three functions have `verify_jwt = true`; the guard then re-checks the user and the permission in the database
(`has_permission('admin')` / `has_any_cms()`, which also require a **verified** session).

### `email-2fa` (any signed-in user, verified or not)

| Action | Request | Response | Errors |
|---|---|---|---|
| `start` | `{ deviceToken? }` | `{ status: 'verified' }` or `{ status: 'code-sent' }` | 429 `rate-limited` (hourly cap), 403 `deactivated`, 502 `send-failed` |
| `send` | `{}` | `{ status: 'code-sent' }` (or `'verified'` if already verified) | 429 `rate-limited` with `retryAfter` seconds, 502 `send-failed` |
| `verify` | `{ code: '123456' }` | `{ deviceToken, expiresAt }` (30 days; store `deviceToken` in the browser) | 400 `wrong-code`, 400 `code-expired`, 429 `rate-limited` |

- `start` order: already verified → `verified`; session `amr` shows an inbox proof (an invite or recovery link) → verified, method `link`;
  `deviceToken` matches an unexpired trusted device of this user → verified, method `trusted-device`; else a code is emailed to
  **`members.email`** (fixed at invite time), never to the JWT's or Auth's current email.
  Calling `start` again within 45 s of the last code does not send another (still `code-sent`).
- Codes: 6 digits, valid 10 minutes, only the newest counts, at most 5 attempts (the 5th wrong try already answers `code-expired`),
  at most 5 codes per user per hour, 45 s between codes (`RESEND_AFTER`). Stored as SHA-256 of `code:<userId>:<code>`; compared in
  constant time. Device tokens: 32 random bytes (base64url), stored as SHA-256 of `device:<token>`.
- A banned or deactivated member gets 401/403 on every action.
- **amr observed on the local stack:** password sign-in → `[{method:'password'}]`; a session from an invite link or a recovery link
  verified with `verifyOtp({ type, token_hash })` → `[{method:'otp'}]` (both). The function accepts `otp`, `magiclink`, `invite`, `recovery`.

### `admin-users` (`admin`)

`AdminUser` is exactly `apps/cms/src/modules/users/data/types.ts`: `{ id, email, permissions, status, lastSignInAt, addedAt }`.

| Action | Request | Response | Notable errors |
|---|---|---|---|
| `list` | `{}` | `AdminUser[]` (oldest first) | |
| `invite` | `{ email, permissions }` | `AdminUser` (status `invited`) | 409 `email-taken`, 400 unknown permission, 429/502 mail |
| `resend` | `{ userId }` | `AdminUser` | 409 `already-active` (signed in or confirmed), 409 `deactivated` |
| `deactivate` | `{ userId }` | `AdminUser` (status `deactivated`) | 409 `self`, 409 `last-admin` |
| `reactivate` | `{ userId }` | `AdminUser` | |
| `setPermissions` | `{ userId, permissions }` | `AdminUser` | 409 `self` (removing your own `admin`), 409 `last-admin`, 400 unknown id |

- `invite` uses the Auth admin API (`inviteUserByEmail`), then calls `admin_set_member` (sets `members.invited_by`) and `set_permissions`. `resend` calls
  `inviteUserByEmail` again, which GoTrue re-sends for a user who never accepted. Both set `redirectTo` to `${AUTH_URL}/invite`; the
  email's link itself comes from the template (`/invite?token=<hash>`).
- `deactivate`: `admin_set_member` sets `members.deactivated_at` (locks out immediately) and, in the same transaction, deletes the member's
  `auth.sessions` (refresh tokens and `verified_sessions` cascade), `trusted_devices` and `email_codes`; then the function bans in Auth
  (`876000h`). So an old refresh token stays dead even after `reactivate`, which lifts the ban and clears `deactivated_at`.
- Rows changed by the service role have no `auth.uid()`, so member changes go through `public.admin_set_member(user, deactivated_at,
  invited_by, actor)` (service role only), which sets `app.actor_id` for `audit_row()`; with `set_permissions` this records the admin's
  email on every action. `deactivated_at` is written as given: null reactivates; `invited_by` is kept when null.

### `media` (`has_any_cms()`)

| Action | Request | Response | Notable errors |
|---|---|---|---|
| `sign` | `{ objects: [{ key, contentType, size }] }` (1 to 12) | `{ urls: [{ key, url }] }` | 400 `invalid-key` (message names the problem) |
| `delete` | `{ key }` (the `media` row's key) | `{ deleted: true }` | 404 `not-found` (no row), 502 `storage-failed` (nothing deleted) |

- `sign` returns SigV4 presigned **PUT** URLs for `${R2_S3_ENDPOINT}/${R2_BUCKET_NAME}/<key>`, valid 10 minutes, with `content-type` and
  `content-length` in the signed headers: the browser must PUT with exactly that `Content-Type`, and R2 refuses a body whose length differs
  from the declared `size` (the browser sets Content-Length from the Blob). For `image/svg+xml` the URL also signs
  `Content-Disposition: attachment`, which R2 stores and serves, so an SVG opened directly on the CDN host downloads instead of running; the
  upload must send that header (`media-live.ts` does). SVGs still render in `<img>`. Then insert the `media` row.
- `public.media` rows are checked by the `media_guard` trigger (`media_row_valid`): allowed top folder, lowercase kebab segments, no `..`/empty/
  absolute segments, the 6-character CMS id; `image` rows need 1 to 4 distinct `widths` in 1..2560 (the CMS also emits one small width for an
  original under 480 px, so the set {480, 960, 1600, 2560} is a subset, not the rule), `svg`/`pdf`/`video` rows have none, a `poster` is only
  allowed on a video and must be its own `{name}.{id}.poster.webp`; kind `other` is refused. Hand-uploaded placeholders never get rows.
- `r2.ts` refuses (`assertSafeKey`) any key with `..`, `//`, a leading `/`, a backslash, `%`, control characters, `?`, `#` or a `.` segment
  before signing or deleting, whatever the caller validated.
- A key is accepted when: top folder is one of `brand site seasons gallery blog sponsors documents press projects links external`;
  every folder is lowercase kebab ASCII; the file is `{name}.{6-char id}[-{width ≤ 2560}].webp`, `{name}.{id}.svg|pdf|mp4` or
  `{name}.{id}.poster.webp`; the extension matches the content type (`image/webp`, `image/svg+xml`, `application/pdf`, `video/mp4`);
  size within 15 MB (images), 30 MB (PDF), 100 MB (video). New top folders go in `TOP_FOLDERS` in `_shared/keys.ts`.
- `delete` removes every R2 object of the row (the `-{width}.webp` variants from `widths`, otherwise the single key, plus `poster`),
  then the row. Rows are member-written, so before touching R2 the function validates `key`, every derived variant key and `poster` with the
  same validator `sign` uses (`validatedObjectsOf` in `_shared/keys.ts`); a bad row is answered 400 `invalid-key` and nothing is deleted.
  If R2 fails the row is kept.

Tests: `deno test supabase/functions/_shared` (key validation, hashing, SigV4 against AWS's published example). The functions
themselves were exercised end to end against the local stack and the real R2 bucket (see the report in the PR/notes).

### Owner steps for production

1. Secrets (Dashboard → Edge Functions → Secrets, or `supabase secrets set --env-file <file>`): `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_S3_ENDPOINT`, `R2_BUCKET_NAME`, `RESEND_API_KEY`, `EMAIL_FROM` (optional), `AUTH_URL=https://auth.brickbot.ro`,
   `CMS_URL=https://cms.brickbot.ro`. Do **not** set `EMAIL_MODE` in production. See `supabase/functions/.env.example`.
2. Deploy: `supabase functions deploy email-2fa admin-users media` (JWT verification stays on; `config.toml` already says so).
3. R2 bucket CORS (Cloudflare → R2 → the bucket → Settings → CORS): allow origins `https://cms.brickbot.ro` and, for local work,
   `http://127.0.0.1:5173`; methods `PUT`; allowed headers `*` (it must include `content-type` and `content-disposition`); max age 3600. (`http://localhost:5173` is a different origin.)
4. Paste the two email templates and subjects below into Authentication → Emails → Templates.
5. Resend: verify the `brickbot.ro` domain so `noreply@brickbot.ro` can send.

## 10. Local development *(filled by the agents)*

### Production Auth and CDN settings (owner, security audit)

- **Authentication → Providers → Email: "Secure email change" ON** (local: `double_confirm_changes = true` in `config.toml`, kept) and
  **"Confirm email" ON** (local: `enable_confirmations = true`; restart the stack to apply it). Even if these slip, the second-factor code goes to
  `members.email`, which an Auth email change does not move.
- **Cloudflare Transform Rule for SVGs on the CDN host** (also in `SETUP.md` §2): Rules → Transform Rules → *Modify Response Header* → *Create rule*.
  Match: hostname equals `cdn-next.brickbot.ro` (later also `cdn.brickbot.ro`) **and** URI Path ends with `.svg`. Set static headers
  `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox` and `X-Content-Type-Options: nosniff`. The
  session cookie is on `.brickbot.ro` and readable by script, so a scripted SVG opened as a page on the CDN host could otherwise read it. New CMS SVGs
  are also stored with `Content-Disposition: attachment`; SVGs uploaded before this change (and hand-uploaded ones) only have the rule.
- **Response headers of auth and cms** come from `dist/_headers`, generated at build by a Vite plugin in each `vite.config.ts` (CSP built from
  `SUPABASE_URL` and `CDN_URL`, `frame-ancestors 'none'`, `nosniff`, referrer and permissions policy). The CMS also allows `https://i.ytimg.com`
  images (YouTube gallery thumbnails) and `https://*.r2.cloudflarestorage.com` for uploads; nothing embeds YouTube, so there is no `frame-src`.
  Any new external origin (analytics, fonts, embeds) has to be added there. `public/_headers` no longer exists in either app.
- R2 API token scoped to the CDN bucket only (SETUP.md) limits the blast radius of any key that slips past validation.

```bash
supabase start            # local stack; Studio :54323, Mailpit :54324
supabase db reset         # apply migrations (and seed.sql when it exists)
supabase test db          # pgTAP tests in supabase/tests
```

Run the Supabase CLI from the repo root (it reads `supabase/config.toml` there); no scratch folder or `--workdir` is needed.

The seed is generated: `node scripts/gen-seed.mjs` rewrites `supabase/seed.sql` from the website's data files (commit both).
The pgTAP tests are independent of other rows in the database (dev users, sessions, publishes): they scope assertions to their
own fixtures, so `supabase test db` passes with a populated local stack.

The scripts below do this themselves. The CLI reads `supabase/config.toml` (it creates `config.jsonc` on `init`; we use the TOML).

- **Local keys:** `supabase status -o env` prints `API_URL`, `ANON_KEY` (use as `SUPABASE_DEV_ANON_KEY`) and `SERVICE_ROLE_KEY`; they are the CLI's public demo keys.
- **Types:** `supabase gen types typescript --local > packages/supabase/src/database.types.ts` (the output is unformatted).
- **Test users:** `node scripts/dev-user.mjs dev-admin@example.test 'a-password-10+' cms.website cms.links admin` creates or updates a
  confirmed local user, signs in, marks the session verified and prints `{ access_token, refresh_token, session_id }`.
  It refuses non-local URLs. Re-running it for the same email revokes that user's earlier sessions (Auth does this on a password update).
  Passwords need at least 10 characters.
- **First admin:** `node scripts/bootstrap-admin.mjs <email> [--local]` invites the email (link to `${AUTH_URL}/invite?token=…`)
  and grants all three permissions. Without `--local` it uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env`.
  It is idempotent and never prints secrets.
- **Production setup the owner does once:** Dashboard → Authentication → Hooks → Custom access token → Postgres function
  `public.custom_access_token_hook`; Authentication → Providers → Email: disable "Allow new users to sign up"; password minimum
  length 10; add the auth app URLs to Redirect URLs. Then `supabase db push` and `node scripts/bootstrap-admin.mjs <email>`.

### Edge Functions and email templates locally *(functions agent)*

- **CLI location.** Run `supabase start`, `status`, `db reset`, `functions serve` … from the repo root. `config.toml` registers the auth email
  templates (`content_path = "./supabase/templates/…"`), which must live inside the project root.
- **Serve the functions** with a scratch env file that holds only what is needed (never the root `.env`):

  ```bash
  printf 'AUTH_URL=http://127.0.0.1:5174\nCMS_URL=http://127.0.0.1:5173\nEMAIL_MODE=log\n' > /tmp/fn.env   # add R2_* only to try uploads
  supabase functions serve --env-file /tmp/fn.env
  ```

  Function logs (including `[email:log] … code=123456`) are in `docker logs supabase_edge_runtime_brick-web`.
  Changes to the templates need the auth container to restart (`supabase stop` then `supabase start`; data persists, never `--no-backup` or
  `db reset`); until then Mailpit shows GoTrue's default invite and recovery emails. Checked locally: both emails render at 600px (black
  ground, exact `#FFEC17` button, Anek Latin with fallbacks) and their links open the set-password screen of the auth app.
- **Type check and tests** need Deno (not installed by default; `npm i deno` in a scratch folder works). Run it on a copy outside the
  repo or it rewrites the root `package.json`: `rsync -a supabase/functions/ /tmp/fn/ && cd /tmp/fn && echo '{"nodeModulesDir":"auto"}' > deno.json && deno check */index.ts && deno test _shared`.
- **Auth email templates** (`supabase/templates/invite.html`, `recovery.html`) link to `{{ .SiteURL }}/invite?token={{ .TokenHash }}` and
  `{{ .SiteURL }}/reset?token={{ .TokenHash }}`, the routes `apps/auth` has (`/invite`, `/reset`, query `token`). The app must call
  `supabase.auth.verifyOtp({ type: 'invite' | 'recovery', token_hash: token })` (the session then has `amr` method `otp`, which `email-2fa`
  treats as proof of the inbox). Production: set Site URL to `https://auth.brickbot.ro` and paste, with these subjects:
  - Invite: subject `You're invited to BrickBot`, body = `supabase/templates/invite.html`.
  - Reset password: subject `Reset your BrickBot password`, body = `supabase/templates/recovery.html`.

### Running `apps/auth` live locally *(auth agent)*

```bash
# stack and `supabase functions serve --env-file <EMAIL_MODE=log, AUTH_URL, CMS_URL>` running (see above)
eval "$(cd /tmp/sb && supabase status --workdir "$PWD_OF_REPO" -o env | grep ^ANON_KEY)"
SUPABASE_DEV_URL=http://127.0.0.1:54321 SUPABASE_DEV_ANON_KEY=$ANON_KEY AUTH_PREVIEW=false pnpm --filter @brickbot/auth dev
```

- `vite dev` defaults to the in-memory preview (any password works) unless `AUTH_PREVIEW=false`; a build previews only with `AUTH_PREVIEW=true`.
  Selection in `src/lib/auth.ts`: preview flag, else live when `VITE_SUPABASE_URL` and the anon key are built in, else `unavailable` (fails closed).
- If port 5174 is taken, Vite picks the next free port; the flows work on any 127.0.0.1 port (the session cookie is host-only, shared across ports).
- The 6-digit code appears in `docker logs supabase_edge_runtime_brick-web` (`[email:log] … code=…`) when `EMAIL_MODE=log`.
- The trusted-device token is kept in `localStorage` key `bb-trusted-devices` (`{ [email]: { token, expiresAt } }`) on the auth origin.
- Email links: the BrickBot templates link straight to `/invite?token=<hash>` and `/reset?token=<hash>` on the auth app (Mailpit, :54324, has an
  HTTP API: `/api/v1/messages`, `/api/v1/message/<id>`). Tokens are single-use, and opening one (the app verifies it on load) also invalidates
  the member's other pending links: a reset link requested before the invite was opened reads "expired".
- After sign-in the app goes to `?redirect=` (https brickbot.ro hosts, or localhost in dev) or to `/apps`, the launcher, which lists apps from
  `my_session().permissions` (the CMS for any `cms.*` or `admin`) and has Sign out. A visitor who already holds a verified session is sent on immediately. The launcher shows one plain line per app (no host)
  and not the "invite-only" footer, which belongs to the signed-out screens.

### CMS access and editors *(final review)*

- **Route guard.** `apps/cms/src/router.tsx` renders a module's routes only if the session's permissions satisfy the module's `requires` in
  `lib/modules.ts` (Admin routes need `admin`); otherwise the member sees "You don't have access to this" in the page area. The rail
  already hides such modules; the guard covers typed URLs. Preview `?perms=` feeds the same session, so it keeps working.
- **Rows without an editor.** Seeded rows have null `created_by` / `updated_by`; `toEdited` then reads `editedBy: ''`. The shared editor frame shows
  "Not edited in the CMS yet", and the Short URLs list does the same instead of an empty name.
- **Typing.** `unwrap` (`lib/data/live-kit.ts`) returns the row for `.single()`, `Row | null` for `.maybeSingle()` and the array for lists, so
  modules need no local helpers or casts. `@brickbot/supabase` re-exports `Database`, `Json`, `Tables`, `TablesInsert` and `TablesUpdate`.

## Known gaps

- **Hand-uploaded CDN files are unprotected by the media guard on purpose** (they have no rows); only CMS keys are managed through the library.
- **Not fixed from the audit's hardening notes** (see `security-audit-skill/brick-web/run-1/REPORT.md` §5): `email-2fa verify` is not bound to
  `email_codes.session_id`; codes have no daily guess cap; trusted devices survive password reset; `media.sign` can still overwrite a known CMS
  key; `public.media` has no audit trigger; `LOCAL_ORIGINS` are allowed in production CORS; last-admin checks are check-then-act.
- **Production Auth settings are the owner's** (§10 "Production Auth and CDN settings"); the repo cannot enforce them.
- **Publish is deferred.** The `publish` function and the CMS Publish button are not connected (the website does not read the database yet).
- **Imported FTC events are not shown in the live CMS.** They need a server-side proxy (Edge Function) so the FTC Events API key stays out of the browser.
- **A media upload that fails midway can leave orphan R2 objects** (uploaded, but no `media` row points to them).
- **Hand-uploaded CDN files have no media rows**, so the Media library does not list them until they are re-uploaded through the CMS.
