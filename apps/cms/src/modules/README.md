# CMS modules

Each module of CLAUDE.md §5 is a self-contained folder here. **A module agent edits only its own folder.** If you need something that is not shared, write it inside your folder. If you think a shared file (`lib/`, `components/`, `styles/`, `router.tsx`, another module) is wrong or missing something, say so in your report; do not edit it.

Read first: `PRODUCT.md` (accounts are emails, never person names), the **projects** module (the worked example below) and the dev-only kit page at `http://127.0.0.1:5173/_kit` (every shared component in use; source in `src/routes/kit.tsx`).

## Anatomy

```
modules/<id>/
  index.ts          default-exports the ModuleDef. The ONLY file the registry imports.
  routes.tsx        route declarations
  <Screens>.tsx     list, editor, tab pages…
  data/
    types.ts        record types (and the Input type an editor saves)
    api.ts          the interface (XApi) + `export const xApi = defineApi<XApi>({ preview })`
    preview.ts      in-memory implementation (+ search), logs activity
    seed.ts         sample data (labelled as such)
    hooks.ts        query keys + useQuery / useContentMutation hooks
  <id>.css          module-specific CSS, imported from index.ts
```

`<id>` is the module's id in `lib/modules.ts`: blog, seasons, team, gallery, projects, support, home-faq, press, settings, linktree, short-urls, media, users, permissions, audit. Path, label, icon and permission come from that catalog; your routes live under its `path`.

## Turning a placeholder into a module

Today an unbuilt folder holds only `index.ts`: `export default placeholderModule('blog')`. **Replace that file.** Do not touch `modules/index.ts` (the registry), `router.tsx` or `lib/modules.ts`: the registry already imports your folder, the router builds routes from it, and the jump palette gets your search from it.

```ts
// modules/projects/index.ts
import type { ModuleDef } from '../types';
import { projectsApi } from './data/api';
import { projectRoutes } from './routes';
import './projects.css';                       // module CSS is imported here, nowhere else

const projects: ModuleDef = { id: 'projects', built: true, routes: projectRoutes, search: (q) => projectsApi.search(q) };
export default projects;
```

`ModuleDef`: `id`, `routes(parent) => AnyRoute[]`, optional `search`, `built: true`. Keep it a `.ts` file (a `.tsx` next to a `.ts` index is ignored by Vite).

### Routes

`routes(parent)` receives the root route and returns the routes under it (use `/blog`, not a relative path). Patterns:

- **List → edit** (blog, seasons, gallery, projects): a layout route whose component is `MasterDetail` + `<Outlet />`, with children `/` (index, `EditorEmpty`), `new`, `$id`. See `projects/routes.tsx`.
- **Tabs** (support, blog: Posts / Topics): a layout route whose component renders `<TabbedModule label tabs />`, each tab a child route; a bare `/<module>` child redirects to the first tab. See `support/routes.tsx`. A tab can itself be list → edit.
- **Table** (short URLs, users, permissions, audit): `TablePage` + `DataTable`.
- **Single record** (settings, home-faq, parts of team): `SettingsPage`.

### Data

1. **Types** in `data/types.ts`. Reuse `Bilingual`, `Edited` (`editedBy`, `editedAt`), `SeasonSummary` from `lib/data`.
2. **Interface + wiring** in `data/api.ts`: an `XApi` interface (list / create / update / remove / search…) and `export const xApi = defineApi<XApi>({ preview })`. When Supabase exists, someone writes `data/supabase.ts` and passes it as `live`; with no `live` yet every call rejects with "not configured", so you write no stubs. Lists return full records; a rule-breaking mutation rejects with an `Error` whose message is safe to show.
3. **Preview store** in `data/preview.ts`: module-level arrays seeded from `data/seed.ts`; every method starts with `await previewDelay()` (and mutations with `previewFailSave()`, which honours `?fail=save`); `search` uses `previewDelay(60)` and `rankSearch`. Use `PREVIEW_ME` for `editedBy`, `nowIso()` for times, `minsAgo` / `daysAgo` / `dayAt` for seed dates. If the seed refers to CDN files, call `addPreviewMedia([...keys])` so your folders show in the pickers.
4. **Hooks** in `data/hooks.ts`: your query keys (`export const xKeys = { all: ['x'] as const }`, always prefixed by the module id) and a `useQuery` per list. **Write with `useContentMutation(fn, keys)`**, never raw `useMutation`: after success it invalidates your keys, the palette's search and the home activity feed for you.
5. **Activity.** In every mutation of `preview.ts` call `logActivity({ action, targetLabel, detail?, module, href })` (from `lib/data/activity`). The actor is the session email; the UI shows "You" for the current member. `action` is a verb phrase that reads after the actor ("edited project", "deleted sponsor"), `targetLabel` is shown bold, `module` is the tag on the row ("Projects", "Short URLs"), `href` is where the row leads.

### Search

Provide `search(query) => Promise<SearchItem[]>` on your api (`{ id, label, hint, href }`, at most 5) and set it as `ModuleDef.search`. The aggregator (`lib/data/search`) only calls it for members whose permissions allow your module, and adds your module's icon. `rankSearch(query, [{ item, text }])` does accent-insensitive matching and ranking.

### Seasons and other shared reference data

`useSeasons()` (`lib/data/hooks`) is a read-only season list for pickers and filters; season ids are the §11 slugs. The Seasons module owns the real records; tell the main thread if you need more than `{ id, game, years, current }`.

## Shared components

All from `components/edit` (`import { … } from '../../components/edit'`). Fields take a dotted `name` ("name.en", "stats.0.value"), read and write the surrounding editor's form, show the error that `validate` returned for that path, and take `label`, `hint?`, `optional?`.

| Component | Stores | Extra props |
|---|---|---|
| `TextField` | string | `type` text/url/email, `multiline`, `placeholder` |
| `SlugField` | string | `prefix`, `onManualEdit` |
| `SelectField` | string | `options: {value,label}[]`, `placeholder` |
| `NumberField` | number or null | `unit` ("€"), `min`, `max`, `step`, `integer`, `placeholder`. min/max guide only; range rules go in `validate` |
| `DateField` | "YYYY-MM-DD" or "" | `min`, `max` |
| `DateTimeField` | ISO instant (UTC) or "" | `min`, `max`. Typed and shown in Europe/Bucharest (`lib/dates`: `isoToInput`, `inputToIso`, `formatDate`, `formatDateTime`) |
| `ToggleField` | boolean | switch, space/enter toggles |
| `TagPicker` | string[] of option values | `options: {value,label}[]`, `max`, `placeholder`, `emptyText` |
| `BilingualField` | `{en, ro}` | `multiline`, `softMax`, `placeholder` |
| `BilingualMarkdownField` | `{en, ro}` | long copy, "Markdown" tag and hint; render it yourself at build time |
| `FileField` | CDN key or null | `folders: string[]` (CDN prefixes to browse), `kind: 'image' \| 'svg' \| 'pdf' \| 'video' \| 'any'`, `tile` light/dark, `compact`, `chooseLabel` |
| `ImageField` | CDN key or null | `FileField` with kind "image" (raster or SVG) |
| `Repeater` | array with `k` ids (`uid()`) | `itemLabel`, `addLabel`, `max`, `empty`, `blank`, children `(i) => fields` |
| `Section`, `Callout` | | `Section`: `title`, `note`, `off`, `offNote` |

Layout:

| Component | Use |
|---|---|
| `EditorFrame` | header (title, last edited, View on site, Delete), ⌘S, leave-without-saving guard, save bar. Props `form, title, edited, back?, viewHref?, remove?` |
| `MasterDetail`, `ListPane`, `ListRow`, `Thumb`, `EditorEmpty`, `EditorMissing`, `EditorSkeleton` | the list → edit pair |
| `SettingsPage`, `SettingsSkeleton`, `SettingsError` | single-record page: `form, title, edited, viewHref?`. Load first, then mount the editor with `useEditForm` seeded from the data (see the doc comment) |
| `DataTable<T>` | `label, rows, columns, rowKey, rowHref?, actions?, loading?, error?, onRetry?, empty, noResults?, filtered?, defaultSort?, selectedKey?, stack?`. `stack` turns rows into labelled cards under ~760px (use it when row actions must stay visible on phones). `Column<T>`: `id, header, cell, sort?, align?, width?, secondary?`. Sortable headers carry `aria-sort`; header sticks |
| `TablePage` | heading, count, `action` (New), `toolbar` (search, filters) around a `DataTable` |
| `TabbedModule`, `TabLater`, `TabPage` | tab row as routes (`label`, `tabs: {href,label}[]`); a not-yet-built tab; a single-column tab page |
| `Dialog`, `MediaPicker` | modal; the file picker `FileField` opens (filtered by kind) |
| `PageHeader` | what a page adds to the shell's header row: `sub` (a count, "Last edited by…") and `actions` (New, Upload). See "Page header" below |
| `Tag` (`components/Tag`) | the one small status tag: `<Tag>` neutral, `<Tag lit>` yellow text + hairline. Never write a private tag style |
| `UploadZone`, `UploadQueue` | drop zone and queue for uploads |

Forms: `useEditForm({ initial, validate, save, onSaved?, derive? })` from `lib/form`: a field is checked ~900 ms after typing stops, on blur, and on save; `FieldError(path, msg)` thrown from `save` lands under that field. Translatable values are `{ en, ro }`; the save bar counts missing translations; the CMS blocks publishing, not saving.

## Page header

The shell draws one header row at the top of every module: the module's name (from `lib/modules.ts`) at the left with a sub line under it, the page's own actions, and on desktop the Publish status and button as the rightmost group. Tabs (`TabbedModule`) sit directly under that row. **Pages never draw their own page title.** `ListPane` (count, "New"), `TablePage` (count, action) and `SettingsPage` ("Last edited by…", View on site) feed the row for you; a custom screen (gallery, media) renders `<PageHeader sub actions />`. **Publish is the only solid yellow in the header row:** whatever you pass as `actions` is drawn outlined (the shell restyles `.btn--primary` inside the row), so keep `btn--primary` on the buttons for body use (an empty state's "New post") and let the header restyle it. The Publish status counts "N changes waiting" per site from the activity saved after the site's last publish, so every mutation must call `logActivity`. A list column keeps no heading of its own: it starts with its search. Phones keep the top bar; the row sits under it.

Thumbnails and previews of CDN files go through `mediaUrl(key, width)` (`lib/data/media`), never `cdn()`, so a file uploaded in this session (an object URL or a CMS base key) displays.

## Look and CSS

- Arena Lights: exact `#FFEC17` (`--color-yellow`) for primary, focus and active; alarm `--color-alarm` only for errors; Anek Latin (headings Expanded 800, labels Condensed caps). Use the tokens in `styles.css` (`--color-*`, `--r-*`, `--rule`, `--line`, `--ease`); no raw hex except in the palette.
- Reuse shared classes (`.btn`, `.btn--primary/--ghost/--sm`, `.link`, `.input`, `.label`, `.notice`, `.iconbtn`, `.skeleton`, `.sr-only`) before writing your own. Prefix your own classes with your module (`.blog-…`).
- Module CSS goes in `<id>.css`, imported from `index.ts`, wrapped in `@layer components { … }`. It loads after the core styles, so it can override them; it must not restyle shared classes.
- Mind the cascade: `.link` sets `font: inherit` and `font-weight`, so a class on a `.link` button cannot change them.

### Concentric corners

Nested rounded boxes must be concentric. A container sets `--ro` (its radius token) and `--pad` (padding plus border); any rounded child inside it uses `border-radius: var(--ri)`, which resolves to `max(--ro - --k * --pad, --k * 4px)` (`--k` is 1, or 2 with squircles). A child that sits deeper sets its own `--pad`. Never write a literal radius on something that sits inside another rounded box. Pills (`border-radius: 999px`) and circles use `corner-shape: round`.

```css
.card { --ro: var(--r-md); --pad: 16px; padding: 16px; border-radius: var(--ro); }
.card .thumb { border-radius: var(--ri); }
```

## Checklist before you hand back

`pnpm --filter @brickbot/cms build` passes; keyboard-only run through list, edit, save, delete; both languages side by side at 1440 and a phone width; empty, loading and error states; your mutations show in "Lately on the team"; your items turn up in the palette.
