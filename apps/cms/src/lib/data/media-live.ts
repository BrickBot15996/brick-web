import type { FileKind } from '../cdn';
import { logActivity } from './activity';
import { FnError, invokeFn } from './functions';
import { sb, unwrap } from './live-kit';
import type { MediaApi, MediaFile, MediaUsage, PreparedObject } from './media';
import { rememberWidths, STORAGE_LIMIT_BYTES } from './media-shared';
import { rankSearch } from './search';

/**
 * The live media layer (docs/backend.md §6, §9): the library is `public.media`; an upload is `media` function `sign`
 * (presigned PUT URLs, at most 12 objects per call) -> a PUT of each object straight to R2 -> one `media` row; a delete
 * is the `media` function's `delete`, which removes the R2 objects and then the row.
 *
 * ORPHAN RISK. The row is inserted last, after every PUT. If a PUT (or the insert) fails once some objects are already in
 * R2, no row exists, so the library shows nothing and the CMS has no handle to delete those objects: they stay in the
 * bucket, unused, until someone removes them by hand. The key carries a fresh random id, so a retry never collides with
 * them. The function has no "delete by key" action; adding one (or a sweep of keys with no row) would close the gap.
 */

const SELECT = '*, uploader:members!uploaded_by(email)';
const PAGE = 1000;
const SIGN_BATCH = 12;
const PUT_PARALLEL = 3;

interface Row {
  key: string; kind: string; size: number | null; width: number | null; height: number | null; widths: number[] | null;
  poster: string | null; uploaded_at: string; uploader?: { email: string } | null;
}
const map = (r: Row): MediaFile => {
  const widths = r.widths?.length ? [...r.widths].sort((a, b) => a - b) : undefined;
  rememberWidths(r.key, widths);
  return {
    key: r.key, kind: r.kind as FileKind, size: r.size ?? undefined, width: r.width ?? undefined, height: r.height ?? undefined,
    widths, poster: r.poster, uploadedBy: r.uploader?.email, uploadedAt: r.uploaded_at,
  };
};
const leaf = (key: string) => key.split('/').pop() ?? key;
const folderOf = (key: string) => (key.includes('/') ? key.slice(0, key.lastIndexOf('/') + 1) : '');

/** Every matching row, newest first, in pages (the API caps a response at 1000 rows). */
async function fetchAll(prefixes: string[], kinds?: FileKind[]): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = sb().from('media').select(SELECT).order('uploaded_at', { ascending: false }).order('key');
    if (prefixes.length) q = q.or(prefixes.map((p) => `key.like."${p.replace(/["\\]/g, '')}*"`).join(','));
    if (kinds?.length) q = q.in('kind', kinds);
    const rows = (await unwrap(q.range(from, from + PAGE - 1))) as unknown as Row[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

/** One PUT with progress. Rejects with a plain message; the response body is never shown. */
function put(url: string, o: PreparedObject, onSent: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.setRequestHeader('Content-Type', o.contentType); // exactly the type the URL was signed for
    // SVGs are signed with this header too: stored as downloads, they never run as a page on the CDN host. Content-Length
    // is signed as well; the browser sets it from the Blob.
    if (o.contentType === 'image/svg+xml') x.setRequestHeader('Content-Disposition', 'attachment');
    x.upload.onprogress = (e) => onSent(e.loaded);
    x.onload = () => {
      if (x.status >= 200 && x.status < 300) { onSent(o.blob.size); resolve(); }
      else reject(new Error(x.status === 403 ? 'The upload link expired or was refused. Try again.' : 'The file store refused the upload. Try again.'));
    };
    x.onerror = () => reject(new Error("Couldn't reach the file store. Check your connection and try again."));
    x.onabort = () => reject(new Error('The upload was cancelled.'));
    x.send(o.blob);
  });
}

/** Runs `fn` over `items`, `n` at a time; stops starting new ones after the first failure and rethrows it. */
async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0, failure: unknown;
  const worker = async () => {
    while (next < items.length && failure === undefined) {
      const item = items[next++];
      try { await fn(item); } catch (e) { failure ??= e; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  if (failure !== undefined) throw failure;
}

// ───────── "used by": the content tables that hold CDN keys ─────────

/** table -> columns that can hold a key, where it is edited, and how its rows read. */
const USERS: { table: string; cols: string; hint: string; href: (r: Record<string, unknown>) => string; label: (r: Record<string, unknown>) => string }[] = [
  { table: 'seasons', cols: 'id, game, game_logo, team_photo, robot, portfolio_pdf, portfolio_cover', hint: 'Seasons', href: (r) => `/seasons/${r.id}`, label: (r) => String(r.game ?? r.id) },
  { table: 'projects', cols: 'id, name, logo, photos', hint: 'Projects', href: (r) => `/projects/${r.id}`, label: (r) => en(r.name, String(r.id)) },
  { table: 'blog_posts', cols: 'id, title, cover', hint: 'Blog', href: (r) => `/blog/${r.id}`, label: (r) => en(r.title, String(r.id)) },
  { table: 'timeline_milestones', cols: '*', hint: 'Team & story', href: () => '/team', label: (r) => en(r.title, 'A timeline milestone') },
  { table: 'team_page', cols: '*', hint: 'Team & story', href: () => '/team', label: () => 'The Team page' },
  { table: 'departments', cols: '*', hint: 'Team & story', href: () => '/team', label: (r) => en(r.name, String(r.id)) },
  { table: 'gallery_items', cols: 'id, key', hint: 'Gallery', href: (r) => `/gallery/${r.id}`, label: (r) => leaf(String(r.key ?? r.id)) },
  { table: 'sponsors', cols: 'id, name, logo', hint: 'Support', href: (r) => `/support/sponsors/${r.id}`, label: (r) => String(r.name ?? r.id) },
  { table: 'support_docs', cols: '*', hint: 'Support', href: () => '/support', label: () => 'Sample contract' },
  { table: 'sponsor_decks', cols: '*', hint: 'Support', href: () => '/support', label: (r) => `Sponsor deck, ${r.season_id}` },
  { table: 'home_hero', cols: '*', hint: 'Home & FAQ', href: () => '/home-faq', label: () => 'Home hero' },
  { table: 'press_kit', cols: '*', hint: 'Press kit', href: () => '/press', label: () => 'The press kit' },
  { table: 'link_cards', cols: '*', hint: 'Linktree', href: () => '/linktree', label: (r) => String(r.title ?? 'A link card') },
];
const en = (v: unknown, fallback: string) => (v && typeof v === 'object' && typeof (v as { en?: unknown }).en === 'string' && (v as { en: string }).en ? (v as { en: string }).en : fallback);

/**
 * Does `text` (a row serialised to JSON) point at the file? A CMS raster is stored as its base key and a variant URL is
 * `{base}-{width}.webp`, so the key must end at a quote or at `-<digits>.webp`; `a.k3f9a2` must not match `a.k3f9a2x`.
 */
function mentions(text: string, key: string): boolean {
  const k = key.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  return new RegExp(`"${k}(?:-\\d+\\.webp)?"`).test(text);
}

type Loose = { from(t: string): { select(c: string): PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }> } };

export const liveMedia: MediaApi = {
  async list({ prefixes, kinds }) {
    return (await fetchAll(prefixes, kinds)).map(map);
  },

  async upload(p, onProgress) {
    const total = p.objects.reduce((n, o) => n + o.blob.size, 0) || 1;
    onProgress(0);
    const urls = new Map<string, string>();
    for (let i = 0; i < p.objects.length; i += SIGN_BATCH) {
      const batch = p.objects.slice(i, i + SIGN_BATCH);
      const res = await invokeFn<{ urls: { key: string; url: string }[] }>('media', {
        action: 'sign', objects: batch.map((o) => ({ key: o.key, contentType: o.contentType, size: o.blob.size })),
      });
      for (const u of res.urls) urls.set(u.key, u.url);
    }
    const sent = new Map<string, number>();
    const report = () => onProgress(Math.min(0.98, [...sent.values()].reduce((a, b) => a + b, 0) / total));
    try {
      await pool(p.objects, PUT_PARALLEL, async (o) => {
        const url = urls.get(o.key);
        if (!url) throw new Error('The upload could not be prepared. Try again.');
        await put(url, o, (loaded) => { sent.set(o.key, loaded); report(); });
      });
    } catch (e) {
      const started = sent.size > 0;
      const why = e instanceof Error && e.message ? e.message : 'Try again.';
      throw new Error(started ? `${why} The upload didn’t finish, so nothing was added to the library.` : why);
    }
    const row = (await unwrap(sb().from('media').insert({
      key: p.key, kind: p.kind, folder: p.folder, size: p.size, width: p.width ?? null, height: p.height ?? null,
      widths: p.widths?.length ? p.widths : null, poster: p.poster ?? null,
    }).select(SELECT).single())) as unknown as Row;
    onProgress(1);
    const file = map(row);
    logActivity({ action: 'uploaded', targetLabel: leaf(p.key), detail: `to ${p.folder || 'the root'}`, module: 'Media library', href: `/media?file=${encodeURIComponent(p.key)}` });
    return file;
  },

  async remove(key) {
    try {
      await invokeFn('media', { action: 'delete', key });
    } catch (e) {
      if (e instanceof FnError && e.code === 'not-found') return; // already gone: the list refreshes without it
      throw e;
    }
    logActivity({ action: 'deleted file', targetLabel: leaf(key), module: 'Media library', href: '/media' });
  },

  /** Looks for the key in the content tables above. Blog bodies and a table this member can't read are not searched. */
  async usage(key) {
    const db = sb() as unknown as Loose;
    const found = await Promise.all(USERS.map(async (u): Promise<MediaUsage[]> => {
      let res;
      try { res = await db.from(u.table).select(u.cols); } catch { return []; }
      if (res.error || !res.data) return [];
      return res.data.filter((r) => mentions(JSON.stringify(r), key)).map((r) => ({ label: u.label(r), hint: u.hint, href: u.href(r) }));
    }));
    return found.flat();
  },

  async storage() {
    const rows = await unwrap(sb().from('media').select('size'));
    let used = rows.reduce((n, r) => n + (r.size ?? 0), 0);
    for (let from = PAGE; rows.length === from; from += PAGE) {
      const more = await unwrap(sb().from('media').select('size').range(from, from + PAGE - 1));
      used += more.reduce((n, r) => n + (r.size ?? 0), 0);
      rows.push(...more);
    }
    return { usedBytes: used, limitBytes: STORAGE_LIMIT_BYTES };
  },

  async search(query) {
    const files = (await fetchAll([])).map(map);
    return rankSearch(query, files.map((f) => ({
      item: { id: f.key, label: leaf(f.key), hint: `File · ${folderOf(f.key) || 'root'}`, href: `/media?file=${encodeURIComponent(f.key)}` },
      text: f.key,
    })));
  },
};
