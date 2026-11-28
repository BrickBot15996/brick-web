---
version: 1
slug: "src-routes-home-tsx"
primary_target: "src/routes/home.tsx"
related_targets: ["src/components/Shell.tsx","src/components/JumpPalette.tsx","src/routes/projects.tsx"]
---

# CMS shell, home and list → edit pattern (cms.brickbot.ro)

Mode: Operate. Audience: BrickBot members (students, mentors) with some of `cms.website`, `cms.links`, `admin`; laptop for real editing, phone for quick fixes and Publish. Task: get to any module or item in one move, see who changed what lately, edit EN | RO side by side, publish. Constraints in `apps/cms/PRODUCT.md` (accounts are emails only, no names; English UI; modules gated by permission).

Decision (2026-11-27): owner locked **Jump Bar** from a code-led surface round (Arena Rail, Perimeter Board, Jump Bar). Sketch: `.impeccable/mocks/decision/jump.html`. Owner revision on locking: no person names anywhere; accounts are emails, so the greeting drops the name and activity rows show the email.

Owner revision (2026-11-27, after the first build): the icon rail must be expandable so module names show without hovering (a toggle widens it to a labelled sidebar; the choice is remembered). Nested rounded corners must be concentric everywhere (inner radius = max(outer − k × padding, k × 4px), the website's rule); the Publish popover button and the jump results' highlighted rows were the first offenders.

Build plan: Sonnet subagents write the code; the lead reviews and dispatches fixes.

## Direction contract

THESIS: The CMS front door is one lit field, not a dashboard: a jump field (also ⌘K or / from any screen) reaches any module or item in one move, and the team's latest changes sit under it as doors back into the work. It refuses the stat-tile admin dashboard and the wide labelled sidebar.

OWN-WORLD: Arena Lights unchanged (`apps/website/DESIGN.md`, `apps/auth/DESIGN.md`): black ground, exact #FFEC17 for Publish, focus, the lit jump field, the active rail icon and initials; ink #F4F1E8 with #BDB9AD / #8E8B81; boards #121210 / #1C1B18; squircles; Anek Latin Expanded 800 headings, Condensed caps for module tags and day groups, regular for reading; alarm #FF7B8E only on errors.

STORY: Member lands on home → types in the field or clicks a module chip → or opens a row of "Lately on the team" (who by email, what, which item) → in a module picks an item from the list, edits EN | RO side by side, saves → Publish at top right pushes saved changes live and shows the build status.

FIRST VIEWPORT: Desktop: 68px icon rail (logo mark; Home and website modules; separator; Linktree, Short URLs, Media library; Admin icons and the account tile at the bottom; tooltips on hover and focus). Top right: "Live · published yesterday 18:42" and the yellow Publish button. Centred 880px column: "Where to?" in Expanded 800, the 76px jump field lit yellow (search icon, "Jump to a module, post, sponsor, season…", ⌘K keys), module chips, "Lately on the team" with an Everyone / Just me switch, rows grouped Today / Yesterday: initials tile, email + action + item, module tag, time, arrow on hover. Phone: a top bar (mark, Publish, menu) replaces the rail; the field goes full width.

FORM: grounded structure "Jump Bar", position 2 on the ordered list (dealt), seed: seed:71e2ce158e8f26eb.
Signature interaction: the jump palette. From any screen ⌘K / Ctrl+K or "/" opens the field as a lit overlay; results group Modules / Items / Actions (Publish), arrow keys move, Enter opens; on home the field is inline and the same component. Edit pattern: master-detail, a 380px list at left (search, filter, "New"), the editor at right with EN | RO columns per translatable field and a sticky save bar showing unsaved state. Motion grammar: the palette rises 8px and fades in 180ms; list → editor swaps cross-fade; reduced motion makes both instant.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
