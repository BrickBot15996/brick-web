# `brick-web`: the web presence of FTC Team #15996 BrickBot

Monorepo for every web platform of BrickBot, the FIRST Tech Challenge robotics team of "Unirea" National College (CNU), Focșani, Romania, run legally by **Asociația BrickBot** (an NGO).

**Status:** planning done; content plan, stack, CDN structure and brand basics are approved (see §12 for the brand). Beyond those brand basics, the design agent has full creative freedom.

**Hard constraint:** free tiers only, across the whole stack.

---

## 1. Platforms

| # | App | Domain | Purpose |
|---|---|---|---|
| 1 | `apps/website` | brickbot.ro | Public presentation website, EN + RO |
| 2 | `apps/links` | links.brickbot.ro | Custom link-in-bio page, EN only |
| 3 | `apps/cms` | cms.brickbot.ro | Manages all content of the website and the linktree |
| 4 | `apps/auth` | auth.brickbot.ro | Team member accounts: login, invites, password reset, account settings, app launcher |
| 5 | `apps/admin` | admin.brickbot.ro | Users and their permissions across platforms, audit log |

---

## 2. Stack (approved)

| Concern | Choice | Notes |
|---|---|---|
| Monorepo | **pnpm workspaces + Turborepo** | |
| website, links | **Astro**, static output; React islands only where interactive; Tailwind | Content is read from Supabase **at build time**. Publishing in the CMS triggers a rebuild (~1–2 min). |
| cms, auth, admin | **Vite + React SPA**, TanStack Router + TanStack Query, Tailwind | No SSR (behind login, no SEO). Talks to Supabase directly; Row Level Security is the security boundary. |
| Rich text (blog) | **Tiptap**, stored as JSON, rendered to HTML at build time | |
| Backend | **Supabase**: Postgres, Auth, Edge Functions | One free project for production; local development via the Supabase CLI (Docker). Region: EU (Frankfurt). |
| Media | **Cloudflare R2**, served at `cdn.brickbot.ro` | Uploads go directly from the browser to R2 using presigned URLs issued by an Edge Function. The CMS resizes images **in the browser** into several WebP widths before upload, so no paid image service is needed. Bucket structure and naming: §11. |
| Email | **Resend**, sending from `@brickbot.ro` | Used as Supabase Auth's custom SMTP and by the contact form. |
| Hosting | **Cloudflare Workers with static assets**, deployed by Workers Builds from GitHub | All five apps are static, which avoids the 3 MiB Worker size limit on the free plan. |
| Analytics | Cloudflare Web Analytics | Replaces the old Vercel Analytics. |
| Bot protection | Cloudflare Turnstile | Contact form. |
| Forms | **Google Forms** (kept) | Recruiting, Academy, portfolio submission. Linked through short URLs. |
| Donations | Stripe payment link (kept) | |

### Repo layout

```
apps/
  website/  links/  cms/  auth/  admin/
  scheduler/          tiny Cloudflare Worker with a Cron Trigger (see §7)
packages/
  ui/                 shared React components (usable in the SPAs and in Astro islands)
  supabase/           typed client, generated DB types, shared cross-subdomain session handling
  content/            build-time queries + zod schemas used by website and links
  config/             shared tsconfig / eslint / tailwind presets
supabase/
  migrations/  functions/  seed.sql
docs/
  legacy-content/     content extracted from the old website and linktree (see §9)
```

### Auth and permissions model

- **Invite-only.** Public signups are disabled; admins invite members from the admin panel. The first and only initial admin is the repo owner.
- **Single sign-on across subdomains:** the Supabase session lives in a cookie scoped to `.brickbot.ro`, shared by auth, cms and admin. Unauthenticated users of cms/admin are sent to `auth.brickbot.ro?redirect=…`.
- **Permissions are strings** stored per user in a `user_permissions` table, backed by a `permissions` catalog so new platforms can add permissions without schema changes. Initial set:
  - `cms.website`: edit website content in the CMS
  - `cms.links`: edit the linktree and short URLs in the CMS
  - `admin`: access the admin panel
- A Supabase **custom access token hook** copies the user's permissions into the JWT. SPAs read them for UI gating; **RLS policies enforce them**.
- **Privileged operations** run in Edge Functions that check the caller's JWT for `admin`: inviting, deactivating and deleting users, changing permissions.
- Deactivated users are banned in Supabase Auth, not deleted, so authorship history is preserved.
- **Audit log:** database triggers record who changed what in permissions and content tables.

---

## 3. Website (brickbot.ro)

### Audiences
1. **Local businesses / sponsors.** These are the reason the site exists in Romanian.
2. **Students** at CNU who may join.
3. **The FTC community:** other teams, judges, mentors.
4. **Parents and the school.**

### Languages and URLs
- **EN and RO**, always prefixed: `/en/...`, `/ro/...`, with **translated slugs**.
- `/` redirects by `Accept-Language`, defaulting to `/en`. A static site can't do this, so a tiny Worker handles `/` only.
- **All content is bilingual**, blog posts included. The CMS requires both languages before publishing.
- Every page needs `hreflang` alternates, a correct per-locale canonical URL, a sitemap, OG images, and an RSS feed per locale for the blog.

### Design leeway (read this, design agent)
The page contents below describe **what is available and what matters, not a fixed layout**. The design agent may reorder, merge, shorten or drop sections, and may sacrifice some content decisions for the sake of a better-looking, more coherent site. Anything marked **mandatory** must still appear somewhere.

### Navigation

```
About ▾         Seasons    BrickLog    Join    Support ▾           Contact    EN/RO
├ Our Story                                    ├ Partner with Us
├ The Team                                     ├ Donate
└ Gallery                                      ├ Our Sponsors
                                               └ Press Kit
```

The design agent picks the primary call to action. Projects are **not** in the navigation yet (see §3.10).

### Sitemap and content

| Page | EN path | RO path |
|---|---|---|
| Home | `/en` | `/ro` |
| Our Story | `/en/about` | `/ro/despre` |
| The Team | `/en/team` | `/ro/echipa` |
| Gallery | `/en/gallery` | `/ro/galerie` |
| Seasons | `/en/seasons`, `/en/seasons/[season]` | `/ro/sezoane`, `/ro/sezoane/[season]` |
| BrickLog | `/en/blog`, `/en/blog/[slug]` | `/ro/blog`, `/ro/blog/[slug]` |
| Join | `/en/join` | `/ro/alatura-te` |
| Partner with Us | `/en/partners` | `/ro/parteneri` |
| Donate | `/en/donate` | `/ro/doneaza` |
| Our Sponsors | `/en/sponsors` | `/ro/sponsori` |
| Press Kit | `/en/press` | `/ro/presa` |
| Contact | `/en/contact` | `/ro/contact` |
| Terms | `/en/terms` | `/ro/termeni-si-conditii` |
| Privacy | `/en/privacy` | `/ro/politica-de-confidentialitate` |

Translated slugs are a starting proposal and can be adjusted.

#### 3.1 Home
A menu of **optional** modules. **The design agent chooses only some of them**, in any order, and decides the CTA(s). None is mandatory except a clear first impression of who BrickBot is.

- **Hero:** tagline "We build our future Brick by Brick!" (legacy; can be reworked) and photos or video.
- **Short intro:** FTC team #15996, CNU Focșani, the first FIRST Tech Challenge team in Vrancea county, STEAM education.
- **Impact numbers:** years active, total awards, people reached, outreach events. All values are **entered manually in the CMS**. They can't be computed, because Romanian teams weren't registered with FIRST before 2020.
- **Mission / "what drives us"** teaser linking to The Team.
- **Timeline teaser:** a few key milestones, linking to Our Story.
- **Current season snapshot:** game, robot, latest result, next event.
- **Latest BrickLog posts.**
- **Gallery teaser:** fun photos/videos, linking to Gallery.
- **Audience paths:** "For students" → Join; "For businesses" → Partner with Us.
- **Seasonal Form 230 callout:** only before the 25 May deadline.
- **Sponsor logo strip:** current season, no tier distinction.
- **FAQ:** CMS-managed. Legacy questions: What is FIRST? / What fields does the team work in? / How can I join? / How can I help?

#### 3.2 About → Our Story
- **FIRST and FTC explained** for non-robotics people (businesses, parents). **Mandatory:** mention **Nație prin Educație**, which brought FTC to Romania (legacy text mentions the partnership with BRD).
- **History of BrickBot as a timeline of key milestones** (CMS-managed), starting in 2016.
- **The school**, "Unirea" National College Focșani. **Mandatory.**

#### 3.3 About → The Team
A human page, **not a department showcase**.
- **Current team photo.**
- **Mission, goals, what drives us.**
- **What our students do:** the range of areas the team covers (engineering, CAD, programming, events, social media, design, photo/video, fundraising) written as opportunities and lived experiences, **not as a list of departments**.
- **Awards:** every award from every season in one place. Filterable by season and/or award type, at the design agent's discretion. This replaces the old per-season achievements carousel.
- **Group photos from every season**, 2016–17 onward.
- Legacy values: outreach, creativity, ambition, team spirit.

#### 3.4 About → Gallery
Photos and videos showing the **fun, human side** of the team and of competitions.
- Items: photo, short video clip (on R2), or YouTube embed for long videos. Each has an optional bilingual caption, a season, an optional date and a featured flag.
- Can be filtered by season. The design agent decides the layout: masonry, lightbox, etc.
- **Storage note:** R2 free tier is 10 GB. Compress clips on upload or in advance; put long videos on YouTube.

#### 3.5 Seasons
- `/seasons` **opens on the current season**, with a way to switch to any past season (Velocity Vortex 2016–17 → BioBuzz 2026–27). `/seasons/[season]` is the permalink for each season.
- **Season content:**
  - **Game:** name, logo, years.
  - **Team photo.**
  - **Robot:** robot image linking to its public **Onshape** document. Making the image itself the link is suggested; the design agent decides.
  - **Engineering portfolio (PDF).**
  - **Event list:** event name, date, location as text + link, and **result**. The result is the rank for qualification-style events, or **Winner / Finalist / Semifinalist…** for playoff events, plus **awards won** at that event. **No match lists or scores.**
  - **Next event**, current season only: name, date, venue as **text + hyperlink (no map)**, optional countdown.
  - **Related BrickLog posts** and gallery items for that season.
- **Data source:**
  - Official events, results and upcoming events are imported from the **FTCScout public API** at build time (data from 2019+).
  - Offseason events (e.g. Bucharest Twin Cup, SparkHope) and pre-2019 data are **entered manually in the CMS**.
  - Manual entries override or supplement imported ones.
  - **Awards are always managed in the CMS** because they need translations.

#### 3.6 BrickLog (blog)
- **List page:** filters by category and season, pagination, RSS per locale.
- **Categories** (CMS-managed, starting set): Competition recaps · Engineering · Outreach · Team life · Announcements.
- **Post page:** cover image, date, category, season, reading time, body, related posts.
- **No author name is shown publicly.** The CMS records the uploading account (and the last editor) for accountability.
- **Every post is bilingual.**
- **Publishing:** any member with `cms.website` can publish; there is no review workflow (the team reviews informally). Statuses: draft / scheduled / published.

#### 3.7 Join
- Why join, with photos that make it attractive to students.
- **Departments** (this is the one place they are listed): Assembly & 3D Design · Programming · Events · Social Media · Graphic Design · Photo/Video · Fundraising. Each gets a description and photos.
- **Requirements** (legacy, unchanged): student at CNU Focșani, over 13, no prior experience needed. You start as a recruit and are brought up to speed.
- **Apply** button linking to the Google Form via short URL `/apply`.

#### 3.8 Support
- **Partner with Us**, for businesses:
  - Why sponsor.
  - **Sponsorship tiers and their benefits**, CMS-editable. Legacy values:
    - Bronze €200 · Silver €500 · Gold €1000 · Diamond €2000 · Ultimate €3000
    - Benefits are cumulative, in this order: social media post → logo in Engineering Notebook → logo on website → logo on roll-up → logo on robot → logo on team shirt → merch with your logo. Bronze gets the first 2, Silver 3, Gold 4, Diamond 5, Ultimate all 7.
  - **Downloadable sponsor deck (PDF)**, uploaded via the CMS.
  - **How sponsorship contracts work**, with a sample contract PDF.
  - **Previous season's budget breakdown:** spending only, in **EUR**, with categories defined in the CMS (no preset categories), including a **remaining money** section.
  - A contact CTA that opens the contact form with Sponsorships preselected.
- **Donate**, for individuals:
  - **Redirect 3.5% of income tax via Form 230.** Romanian citizens, from the start of the year until **25 May**. Link: `formular230.ro/asociatia-brickbot`.
  - **Stripe donation** (secure online).
  - **Association details:** Asociația BrickBot, CIF 50846996, Banca Transilvania (Focșani subsidiary), IBAN `RO05BTRLEURCRT0690572901` with a copy button.
- **Our Sponsors:** the current season's sponsors with logos and links. **No visible tier grouping.** Tiers are stored in the database but not displayed.
- **Press Kit:** logos (SVG/PNG, light/dark), wordmark, approved team and robot photos, a short and a long team description (EN + RO), and the contact for press. All files are managed in the CMS and stored in R2.

#### 3.9 Contact
- **Contact form:** name, email, department, subject, message, Turnstile.
  - Handled by a Supabase Edge Function that verifies Turnstile and sends via Resend.
  - **Nothing is stored** and there is no inbox in the CMS.
  - Always sent **to `contact@brickbot.ro`**, CC'ing the selected department:

    | Department option | CC |
    |---|---|
    | General | none |
    | PR / Events / Social Media | pr@brickbot.ro |
    | Design | design@brickbot.ro |
    | Engineering | engineering@brickbot.ro |
    | Programming | programming@brickbot.ro |
    | Sponsorships / Fundraising | sponsorships@brickbot.ro |
  - `Reply-To` is set to the sender's email.
- **Direct contacts:** `contact@brickbot.ro` (the **only public email**), Instagram, LinkedIn. **No public phone number.**
- **Address:** 15 Cezar Bolliac Street, Focșani, Vrancea, Romania.
  - Show **Google Maps**, using the team's existing **Google Business Profile** (embed iframe + "Open in Google Maps" link).
  - No OpenStreetMap.

#### 3.10 Projects (deferred)
Projects are being restructured after an intra-team discussion. **Do not build project pages yet**, and do not put them in navigation. Keep the architecture open for a future `/projects` section with CMS-managed projects. Legacy projects for reference:
- The Vault: FTC portfolio library
- Checkpoint: outreach events
- Sparks: meetups with other FTC teams
- BrickDocs: `docs.brickbot.ro`
- BrickBot Academy: global mentorship program, currently only a Google Form
- SimplicityFTC: **discontinued**

#### 3.11 Footer and legal
- **Footer:** wordmark, social icons, links to all sections, Terms, Privacy, **ANPC SAL and ODR badges** (mandatory for Romanian online payments), **Nație prin Educație logo bar**, "BrickBot © {year}".
- **Terms and Privacy** are stored as Markdown in the repo (rarely change, legally sensitive). Start from the legacy text in `docs/legacy-content/*.json` and update it:
  - email → `contact@brickbot.ro`
  - address → 15 Cezar Bolliac
  - remove the phone number
  - add sections on the contact form (data is emailed, not stored) and Cloudflare Web Analytics

### 3.12 Short URLs (`brickbot.ro/<slug>`)
Fully managed in the CMS: create, edit, **delete any**, including the starting set.
- Generated into the website's `_redirects` file at build time, so changes go live on publish.
- Slugs must not collide with locale prefixes or page routes.

Starting set (seed):

| Slug | Destination |
|---|---|
| `/apply` | `https://forms.gle/kr4LBrLzFzvTW4S18` |
| `/academy` | `https://forms.gle/16HcqxaW3yd2SXBd7` |
| `/submit-portfolio` | `https://forms.gle/YGcVdcwkANbtqKNs5` |
| `/formular230` | `https://formular230.ro/asociatia-brickbot` |
| `/stripe` | `https://donate.stripe.com/00w6oI2wK5wBfQT0Sw5J602` (new; `/donate` and `/doneaza` are now real pages) |
| `/docs` | `https://docs.brickbot.ro` |

**Legacy URL redirects** (permanent, defined in code rather than the CMS):
- `/donate` → `/en/donate`, `/doneaza` → `/ro/doneaza`
- `/en/our-team` → `/en/team`, `/ro/despre-noi` → `/ro/echipa`
- `/en/support-us` → `/en/partners`, `/ro/sustine-ne` → `/ro/parteneri`
- `/en/privacy-policy` → `/en/privacy`
- old `/projects/*` paths → home, until projects return

---

## 4. Linktree (links.brickbot.ro)
English only. Its audience is people who arrive from social media.

- **Header:** logo, wordmark, "FTC Team 15996".
- **Social icons** (CMS-managed, ordered):

  | Network | URL |
  |---|---|
  | Website | brickbot.ro/en |
  | Instagram | instagram.com/brickbotcnu |
  | Facebook | facebook.com/brickbotcnu |
  | TikTok | tiktok.com/@brickbotcnu |
  | LinkedIn | linkedin.com/company/brickbot |
  | Email | mailto:contact@brickbot.ro |
  | YouTube | youtube.com/channel/UCRpA5UNXSZDl2GmPt_E91ew |
  | GitHub | github.com/BrickBot15996 |
- **Link cards** (CMS-managed): title, display URL, target URL, optional icon, highlighted flag, order, and optional **start/end dates**.
  - Dates are also checked on the client, so they take effect without a rebuild. This generalises the legacy hardcoded Form 230 cutoff.
  - Legacy cards:
    - "Join our global mentorship program, BrickBot Academy!" (highlighted)
    - "Support BrickBot through a secure online donation!" (now → brickbot.ro/en/donate)
    - "Redirect 3.5% of your income tax to help BrickBot!" (visible until 24 May)
- Footer: "BrickBot © {year}".
- Socials (and the contact email) are **shared** with the website footer and contact page through one source of truth in the database.

---

## 5. CMS (cms.brickbot.ro)
Modules, each gated by a permission:

| Module | Permission | Manages |
|---|---|---|
| Blog | `cms.website` | Posts (EN + RO Tiptap bodies, cover, category, season, status, scheduled date, SEO overrides), categories |
| Seasons | `cms.website` | Seasons (game name/logo/years, current flag, FTCScout season code, team photo, robot image, Onshape URL, portfolio PDF), manual events and result overrides, awards |
| Team & story | `cms.website` | Timeline milestones, mission text, impact numbers, team photo, Join page content (departments, photos) |
| Gallery | `cms.website` | Photos, video clips, YouTube embeds, captions, season, featured |
| Support | `cms.website` | Sponsors (logo, link, season, tier: internal only), tiers and benefits, sponsor deck, sample contract, budget (categories + amounts in EUR + remaining) |
| Home & FAQ | `cms.website` | Hero media, FAQ items, Form 230 callout dates |
| Press kit | `cms.website` | Assets and descriptions |
| Site settings | `cms.website` | Contact email, address, Google Maps link, association details (CIF, bank, IBAN), social links |
| Linktree | `cms.links` | Link cards, social icon order |
| Short URLs | `cms.links` | Create / edit / delete redirects |
| Media library | any `cms.*` | Browse and upload to R2 (client-side resize to WebP variants) |
| **Publish** | any `cms.*` | Triggers website and/or links rebuilds via Cloudflare deploy hooks, through an Edge Function. Shows the last build status. |

Translatable fields are stored as `jsonb` in the form `{ "en": "...", "ro": "..." }`. The CMS shows both languages side by side and blocks publishing when either is missing (website content only; the linktree is EN only).

---

## 6. Auth (auth.brickbot.ro) and Admin (admin.brickbot.ro)
- **Auth app:**
  - login (email + password, magic link)
  - accept invite / set password
  - forgot / reset password
  - account settings (display name, avatar, password)
  - **app launcher** showing only the apps the user has permission for
- **Admin app:**
  - user list
  - invite user
  - deactivate / reactivate
  - **permission matrix** (users × permissions)
  - audit log viewer
- **Auth emails** (invite, reset, magic link) use Resend SMTP, branded for BrickBot.

---

## 7. Scheduled jobs (`apps/scheduler`)
One Cloudflare Worker with a Cron Trigger (free). It runs **daily, plus every few hours during competition months**, and:
1. Triggers a website rebuild. This publishes scheduled posts and refreshes FTCScout results and upcoming events.
2. Pings Supabase. **Free projects pause after 7 days of inactivity**, and the static site doesn't query Supabase on visits.

---

## 8. Free-tier budget (keep in mind)
- **Supabase free:**
  - 500 MB database, 50k monthly active users, Edge Functions 500k calls/month
  - 2 projects per organization
  - pauses after 7 days idle (handled by §7)
- **Cloudflare:**
  - static asset requests are free and unlimited
  - Workers 100k requests/day (only the `/` redirect, scheduler and nothing else)
  - Workers Builds 3,000 min/month
  - R2: 10 GB storage, free egress
- **Resend free:** 3,000 emails/month, 100/day.

---

## 9. Reference content
`docs/legacy-content/` holds everything extracted from the old Next.js website and linktree, which were deleted from this repo. Their originals live in the org's GitHub repos. Use it to **seed the database**.

| Path | Contents |
|---|---|
| `en.json`, `ro.json` | All legacy texts in both languages: about, FAQ, team intro, carousel captions, Checkpoint/Sparks texts, support-us texts, contact, full Terms and Privacy, awards, portfolio awards, tier benefits |
| `data/seasons-data.tsx` | 11 seasons (name, years, logo path, awards) |
| `data/sponsor-data.tsx` | 22 sponsors of 2025–26 (name, logo, website, tier) |
| `data/sponsor-tiers-data.tsx` | Tiers |
| `data/portfolio-data.tsx`, `data/team-data.tsx` | The Vault portfolios: BrickBot + other teams (deferred) |
| `data/projects-data.tsx` | Legacy project metadata and accent colors (deferred) |
| `data/linktree-page.tsx` | Legacy linktree |
| `cdn-assets.txt` | Every path the **old** bucket used, grouped by page. **These paths are obsolete:** the bucket is being rebuilt from scratch with the structure in §11. The file only shows which images existed (hero/about photo sets, season group photos, sponsor and season logos, brand assets). Never link to these paths. |

**Key facts:**
- Team #15996, active since 2016.
- First FTC team in Vrancea county.
- The association's legal seat is 15 Cezar Bolliac Street, Focșani, Vrancea.
- CIF 50846996.
- GitHub org: `BrickBot15996`.

---

## 10. Setup

The owner's account and infrastructure setup is tracked in **`SETUP.md`**. Read it to know what exists (keys, services, domains) and what is still pending. When a step there is a prerequisite for your task and it isn't checked off, tell the owner instead of working around it.

**Environment variables:**
- `.env.example` (committed) lists every variable name. The owner's values live in the git-ignored root `.env`.
- Every app reads from that root `.env`.
- Variables marked `[SECRET]` must never reach browser code; only Edge Functions, the scheduler and local scripts may use them.
- Each framework's browser prefix (`VITE_` / `PUBLIC_`) is mapped in each app's config, not by renaming variables.
- When adding a variable, add it to `.env.example` with its marker and its source step.

---

## 11. CDN structure (`cdn.brickbot.ro`, R2)

The bucket is rebuilt from scratch with this structure.
- **Before launch:** agents decide which files they need and request them at exact paths following this structure. The owner uploads them manually.
- **After launch:** the CMS uploads to the same structure.

### Rules
- **Names:** lowercase, kebab-case, ASCII only (no diacritics: `primaria-focsani`, not `primăria-focșani`), no spaces.
- **`{season}` slugs:** `velocity-vortex`, `relic-recovery`, `rover-ruckus`, `skystone`, `ultimate-goal`, `freight-frenzy`, `powerplay`, `centerstage`, `into-the-deep`, `decode`, `biobuzz`.
- **Other slugs:** `{post}`, `{sponsor}`, `{department}` and `{milestone}` are the entity's slug in the database at upload time. Renaming an entity later does **not** move its files; the database stores the full key.
- **Formats:**

  | Type | Format |
  |---|---|
  | Photos | `.webp`, long edge ≤ 2560 px, quality ~85 |
  | Logos and graphics | `.svg` preferred, otherwise transparent `.png` |
  | Documents | `.pdf` |
  | Video | `.mp4` (H.264, ≤ 1080p, keep under ~50 MB) with a poster `{name}.poster.webp` next to it |
- **Files uploaded by hand (temporary placeholders):**
  - They exist only so the design can be previewed before the CMS exists, and are replaced through the CMS soon after it launches.
  - Each is a single file at a plain name, e.g. `seasons/decode/team-photo.webp`, with **no size variants**.
  - Image components must handle this case: no variants means no `srcset`, just the single file.
- **Files uploaded by the CMS:**
  - They get a 6-character random id, e.g. `team-photo.k3f9a2`.
  - **Raster images** are resized in the browser into WebP variants named `{name}.{id}-{width}.webp`, for widths **480 / 960 / 1600 / 2560**. Only widths no larger than the original are generated. Example: `seasons/decode/team-photo.k3f9a2-960.webp`.
  - The database stores the base key (`seasons/decode/team-photo.k3f9a2`), the generated widths and the original's dimensions. Sites build `srcset` from them.
  - SVG, PDF and video files are stored once, as `{name}.{id}.{ext}`.
  - Replacing a file always creates new keys; the database is updated and the old objects are deleted.
  - Because CMS keys never change content, they can be cached for 1 year (Cache Rule in `SETUP.md`).
- **Requesting files:** agents list every file they need in **`docs/cdn-manifest.md`** with path, description, format and dimensions, plus a status (`requested` / `uploaded`). The owner uploads from that list.

### Tree

```
brand/                                  brand assets (manual, rarely change)
  logo.svg                              primary logo mark
  logo-{variant}.svg                    e.g. logo-white.svg, logo-black.svg
  wordmark.svg, wordmark-{variant}.svg
  lockup.svg                            logo + wordmark, if needed
  favicon.ico, icon.svg, apple-touch-icon.png (180), icon-192.png, icon-512.png
  og-default.jpg                        1200×630 default social preview
  graphics/{name}.svg|webp              lightning bolts, patterns, textures… (design agent decides)
  fonts/{family}/{file}.woff2           only if a font must be self-hosted

site/                                   page-level media (CMS "Home & FAQ", "Team & story")
  home/{name}.webp|mp4                  hero media and other home visuals
  story/{name}.webp                     Our Story visuals
  story/timeline/{milestone}.webp       one image per timeline milestone
  team/{name}.webp                      The Team page photos (mission, students at work…)
  join/{name}.webp                      Join page general photos
  join/{department}/{name}.webp         department photos
  og/{page}.jpg                         per-page social previews, if not generated at build

seasons/{season}/
  game-logo.svg|webp
  team-photo.webp
  robot.webp                            robot image (links to Onshape)
  portfolio.pdf
  portfolio-cover.webp                  optional thumbnail

gallery/{season}/{name}.webp|mp4        Gallery items; gallery/general/ for items without a season

blog/{post}/cover.webp
blog/{post}/{name}.webp                 images inside the post body

sponsors/{sponsor}.svg|png|webp         sponsor logos

documents/
  sponsor-deck-{yyyy-yy}.pdf            e.g. sponsor-deck-2026-27.pdf
  sample-contract.pdf

press/
  brickbot-press-kit.zip                optional bundle
  photos/{name}.webp                    approved press photos
                                        (logos on the Press Kit page link to brand/)

links/icons/{name}.svg                  linktree card icons (e.g. form-230.svg)

external/                               third-party marks
  anpc-sal.svg, anpc-sol.svg
  natie-prin-educatie.svg               Nație prin Educație logo bar
  first.svg, ftc.svg                    FIRST / FTC marks, if used
  cnu.svg                               "Unirea" National College
  form-230.svg, stripe.svg              payment/redirect method marks, if used
```

Agents may add new folders when a need isn't covered, as long as they follow the rules above. Record new folders in this section.

---

## 12. Brand basics (the only fixed design inputs)

| Role | Color | Rule |
|---|---|---|
| Background | Black `#000000` | A slightly lighter near-black is allowed to reduce eye strain. |
| **Primary** | Bright Yellow **`#FFEC17`** | **Must be used exactly as given. Never tint or shift it.** |
| Secondary | Burgundy `#4C0414` | May be made somewhat brighter for contrast against the dark background. |

- **Theme: electric / cyber.** Lightning bolts, electricity and energy are an important part of the brand.
- The site is **dark-first**.
- Everything else is the design agent's decision: typography, layout, motion, imagery, extra neutrals and tints, and the components. This includes trading some content decisions in §3 for a better result (see "Design leeway").
- Legacy brand assets (logo, wordmark, the "We build our future Brick by Brick!" banner) exist and will be re-uploaded under `brand/`. Ask for them in `docs/cdn-manifest.md`.
