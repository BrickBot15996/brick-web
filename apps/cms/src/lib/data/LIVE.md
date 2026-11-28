# Writing a module's `live.ts`

Next to the module's `data/preview.ts`, write `data/live.ts` exporting an object that implements the module's `XApi`, then wire it:
`export const xApi = defineApi<XApi>({ preview: previewX, live: liveX })` (`data/api.ts`). Types, hooks and screens do not change.
Read `docs/backend.md` §8 for the table, column and type mapping of your module. Never edit `supabase/`; ask the lead.

## `live-kit.ts` helpers

| Helper | What it does |
|---|---|
| `sb()` | The typed Supabase client, created on first use. |
| `unwrap(query, names?)` | Awaits a query, returns its data, or throws an `Error` that is safe to show (unique `23505` -> "That slug is already taken.", RLS -> "You don't have permission to change this.", network -> "Can't reach the server. Check your connection."; messages the database raised on purpose, such as the post rules, pass through). `names` maps a constraint or column to a noun: `{ short_urls_pkey: 'short URL' }`. |
| `fail(error, names?)` | The mapper behind `unwrap`, for results you read yourself (counts, `rpc`). Returns `never`. |
| `EDITED_BY`, `CREATED_BY` | Select fragments that embed the member email of `updated_by` / `created_by`. |
| `toEdited(row)`, `createdBy(row)` | Read those embeds: `Edited` (`editedBy`, `editedAt`) and the creator email. |
| `bilingual(json)` | A jsonb `{en, ro}` as `Bilingual`, empty strings when malformed. |

A record built from several rows (tier plan, budget, socials) uses the latest `updated_at` among its rows for `Edited`.

## Worked example: short URLs (`short_urls`, permission `cms.links`)

```ts
import { logActivity } from '../../../lib/data/activity';
import { CREATED_BY, EDITED_BY, createdBy, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import { destinationError, reservedReason, slugShapeError } from '../reserved';
import type { ShortUrlsApi } from './api';
import type { ShortUrl } from './types';

const SELECT = `*, ${EDITED_BY}, ${CREATED_BY}`;
const NAMES = { short_urls_pkey: 'short URL', short_urls_slug_not_reserved: 'short URL' };
const map = (r: { slug: string; url: string; created_at: string; updated_at: string; editor?: { email: string } | null; creator?: { email: string } | null }): ShortUrl =>
  ({ slug: r.slug, to: r.url, createdBy: createdBy(r), createdAt: r.created_at, ...toEdited(r) });

async function list() { return (await unwrap(sb().from('short_urls').select(SELECT).order('slug'))).map(map); }

export const liveShortUrls: ShortUrlsApi = {
  list,
  async create(input) {
    // Keep the client-side checks the preview does (shape, reserved, destination): they give field-level messages.
    const slug = input.slug.trim();
    const e = slugShapeError(slug) ?? reservedReason(slug) ?? destinationError(input.to, slug);
    if (e) throw new Error(e);
    const row = await unwrap(sb().from('short_urls').insert({ slug, url: input.to.trim() }).select(SELECT).single(), NAMES);
    logActivity({ action: 'added short URL', targetLabel: `/${slug}`, module: 'Short URLs', href: `/short-urls/${slug}` });
    return map(row);
  },
  async update(slug, input) {
    const next = input.slug.trim();
    const row = await unwrap(sb().from('short_urls').update({ slug: next, url: input.to.trim() }).eq('slug', slug).select(SELECT).single(), NAMES);
    logActivity({ action: 'edited short URL', targetLabel: `/${next}`, module: 'Short URLs', href: `/short-urls/${next}` });
    return map(row);
  },
  async remove(slug) {
    await unwrap(sb().from('short_urls').delete().eq('slug', slug));
    logActivity({ action: 'deleted short URL', targetLabel: `/${slug}`, module: 'Short URLs', href: '/short-urls' });
  },
  async search(query) {
    const rows = await list();
    return rankSearch(query, rows.map((r) => ({
      item: { id: r.slug, label: `/${r.slug}`, hint: `Short URL · ${r.to.replace(/^https?:\/\//, '').slice(0, 40)}`, href: `/short-urls/${r.slug}` },
      text: `${r.slug} ${r.to}`,
    })));
  },
};
```

## Rules

- **Edited-by.** Select `*, ${EDITED_BY}` (and `${CREATED_BY}` when the type has `createdBy`). The database stamps `created_*` / `updated_*` by trigger: never send them.
- **Activity.** After every successful mutation call `logActivity` with the same entries the preview logs. It is fire and forget and never throws. The audit log is written by triggers, so you do not write it.
- **Errors.** Wrap every query in `unwrap`; do not read `error.message` yourself. A rule the database enforces (reserved slug, one current season, post rules) comes back as a safe message. Pass `names` for any unique constraint a user can hit.
- **Typing.** `unwrap` returns the row for `.single()`, `Row | null` for `.maybeSingle()` and the array for a list query. Use it directly: no local `one`/`maybe` helpers, no `as unknown as Row` casts. `Json`, `Tables` and friends come from `@brickbot/supabase`.
- **Single-row tables** (`site_settings`, `home_hero`...): `.eq('id', 1).single()` to read, `.upsert({ id: 1, ... })` to save.
- **Replace-the-children saves** (departments, budget lines, link cards, socials) are several statements, not a transaction: delete the removed ids, upsert the rest, then re-read.
- **Search.** There is no server search: load the list (`list()`), then `rankSearch(query, ...)` exactly like the preview. The lists are small.
- **Order.** Ask the database for the order the screen needs (`.order('sort')`); do not sort in the client unless the preview does.
- `numeric` columns arrive as numbers; `date` columns as `YYYY-MM-DD`; `timestamptz` as ISO strings.
