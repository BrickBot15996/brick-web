# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

BrickBot team members: CNU students (about 13–19) and a few mentors. Each holds some of the permissions `cms.website`, `cms.links` and `admin` (root `CLAUDE.md` §2), and sees only the modules those allow. Most arrive from auth.brickbot.ro after signing in. Real editing happens on a laptop at school or at home; a phone must work for quick fixes, checking what changed, and publishing (owner, 2026-11-27).

## Product Purpose

Let the team keep brickbot.ro and links.brickbot.ro current without touching code: blog posts, seasons and awards, gallery, projects, sponsors, press kit, site settings, the linktree and short URLs, plus member and permission management for admins. Success: a member finds the module they need in one move, edits both languages side by side, publishes, and knows who else changed what lately.

## Positioning

The team's own control room for its public presence: the same club as the website, links and auth, seen from the inside. Built for a handful of students who rotate every season, not for a content department.

## Operating Context

- Vite + React SPA, TanStack Router + Query, Tailwind, talking to Supabase directly; Row Level Security is the security boundary (root `CLAUDE.md` §2). Session cookie shared with auth on `.brickbot.ro`; unauthenticated visitors go to `auth.brickbot.ro?redirect=…`.
- Saving writes to the database; the public sites change only after **Publish** triggers a rebuild (about 1–2 minutes) through an Edge Function. The scheduler also rebuilds daily.
- Media uploads go from the browser to R2 after in-browser resizing to WebP widths 480/960/1600/2560 (§11).
- Free tiers only.

## Capabilities and Constraints

- **Modules** (root `CLAUDE.md` §5): Blog, Seasons, Team & story, Gallery, Projects, Support, Home & FAQ, Press kit, Site settings (`cms.website`); Linktree, Short URLs (`cms.links`); Media library and Publish (any `cms.*`); Admin → Users, Permissions, Audit log (`admin`). The sidebar shows only permitted modules; Admin is its own group. A user with only `admin` sees only Admin.
- **Bilingual fields** are stored as `{ en, ro }` and shown side by side; publishing website content is blocked while either language is missing. The linktree is English only.
- **Audit log:** database triggers record who changed what in content and permission tables.
- **English UI only** (team tool).
- **Accounts carry only an email (owner, 2026-11-27):** no display names, avatars or profiles exist. Wherever a person appears (activity, last editor, audit log, users list) they are shown by email, and the current member as “You”. Never greet or label anyone by name.
- **First design round (owner, 2026-11-27):** the app shell, the home screen, and the list → edit pattern that most modules share.
- **Home screen's job (owner, 2026-11-27):** jump into a module fast, and show recent team activity (who changed what lately). Unpublished changes and attention lists were not chosen as the home's lead.

## Brand Commitments

Inherits the BrickBot brand and the Arena Lights system (`apps/website/DESIGN.md`, `apps/auth/DESIGN.md`): exact #FFEC17, black ground, Anek Latin only, logo mark and BRICKBOT wordmark with the optical nudge from root `CLAUDE.md` §12, electric/cyber theme, dark-first. It must look like the same family as brickbot.ro, links.brickbot.ro and auth.brickbot.ro. Voice: confident teens, plain words, short.

## Evidence on Hand

- Brand assets on `cdn.brickbot.ro/brand/`; Anek Latin woff2 files in `apps/auth/public/fonts/`.
- Team and season photos in `apps/website/public/preview/` (listed in `docs/cdn-manifest.md`).
- Seed content in `docs/legacy-content/` (seasons, sponsors, tiers, texts).

## Product Principles

1. **One move to the work.** Any module is one click from anywhere; the home screen is a launchpad, not a report.
2. **Know who touched it.** Recent changes and their authors are visible where people work, so nobody overwrites a teammate blind.
3. **Both languages, side by side.** EN and RO are edited together and nothing half-translated reaches the site.
4. **Same club, working view.** Unmistakably BrickBot, calmer than the public site; density and clarity outrank spectacle.

## Accessibility & Inclusion

WCAG 2.2 AA. Keyboard reachable throughout, visible focus, respects reduced motion. Works from 320px wide for the phone tasks above.
