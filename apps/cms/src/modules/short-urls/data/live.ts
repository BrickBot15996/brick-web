import { logActivity } from '../../../lib/data/activity';
import { CREATED_BY, EDITED_BY, createdBy, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import { destinationError, reservedReason, slugShapeError } from '../reserved';
import type { ShortUrlsApi } from './api';
import type { ShortUrl, ShortUrlInput } from './types';

const SELECT = `*, ${EDITED_BY}, ${CREATED_BY}` as const;
const NAMES = { short_urls_pkey: 'short URL' };
type Row = { slug: string; url: string; created_at: string; updated_at: string; editor?: { email: string } | null; creator?: { email: string } | null };
const map = (r: Row): ShortUrl => ({ slug: r.slug, to: r.url, createdBy: createdBy(r), createdAt: r.created_at, ...toEdited(r) });

function check(input: ShortUrlInput) {
  const slug = input.slug.trim();
  const e = slugShapeError(slug) ?? reservedReason(slug) ?? destinationError(input.to, slug);
  if (e) throw new Error(e);
  return { slug, url: input.to.trim() };
}

async function list() { return (await unwrap(sb().from('short_urls').select(SELECT).order('slug'))).map(map); }

export const liveShortUrls: ShortUrlsApi = {
  list,
  async create(input) {
    const v = check(input);
    const row = await unwrap(sb().from('short_urls').insert(v).select(SELECT).single(), NAMES);
    logActivity({ action: 'added short URL', targetLabel: `/${v.slug}`, module: 'Short URLs', href: `/short-urls/${v.slug}` });
    return map(row);
  },
  async update(slug, input) {
    const v = check(input);
    const row = await unwrap(sb().from('short_urls').update(v).eq('slug', slug).select(SELECT).maybeSingle(), NAMES);
    if (!row) throw new Error('This short URL no longer exists.');
    logActivity({ action: 'edited short URL', targetLabel: `/${v.slug}`, module: 'Short URLs', href: `/short-urls/${v.slug}` });
    return map(row);
  },
  async remove(slug) {
    const gone = await unwrap(sb().from('short_urls').delete().eq('slug', slug).select('slug'));
    if (gone.length) logActivity({ action: 'deleted short URL', targetLabel: `/${slug}`, module: 'Short URLs', href: '/short-urls' });
  },
  async search(query) {
    const rows = await list();
    return rankSearch(query, rows.map((r) => ({
      item: { id: r.slug, label: `/${r.slug}`, hint: `Short URL · ${r.to.replace(/^https?:\/\//, '').slice(0, 40)}`, href: `/short-urls/${r.slug}` },
      text: `${r.slug} ${r.to}`,
    })));
  },
};
