import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import { destinationError, reservedReason, slugShapeError } from '../reserved';
import type { ShortUrlsApi } from './api';
import { shortUrls as seed } from './seed';
import type { ShortUrl, ShortUrlInput } from './types';

let rows: ShortUrl[] = seed.map((r) => ({ ...r }));

function check(input: ShortUrlInput, ignore?: string) {
  const slug = input.slug.trim();
  const e = slugShapeError(slug) ?? reservedReason(slug) ?? destinationError(input.to, slug);
  if (e) throw new Error(e);
  if (slug !== ignore && rows.some((r) => r.slug === slug)) throw new Error(`/${slug} already exists.`);
  return { slug, to: input.to.trim() };
}

export const previewShortUrls: ShortUrlsApi = {
  async list() { await previewDelay(); return [...rows]; },
  async create(input) {
    await previewDelay();
    previewFailSave();
    const v = check(input);
    const r: ShortUrl = { ...v, createdBy: ME, createdAt: nowIso(), editedBy: ME, editedAt: nowIso() };
    rows = [...rows, r];
    logActivity({ action: 'added short URL', targetLabel: `/${r.slug}`, module: 'Short URLs', href: `/short-urls/${r.slug}` });
    return r;
  },
  async update(slug, input) {
    await previewDelay();
    previewFailSave();
    const old = rows.find((r) => r.slug === slug);
    if (!old) throw new Error('This short URL no longer exists.');
    const v = check(input, slug);
    const r: ShortUrl = { ...old, ...v, editedBy: ME, editedAt: nowIso() };
    rows = rows.map((x) => (x.slug === slug ? r : x));
    logActivity({ action: 'edited short URL', targetLabel: `/${r.slug}`, module: 'Short URLs', href: `/short-urls/${r.slug}` });
    return r;
  },
  async remove(slug) {
    await previewDelay();
    previewFailSave();
    if (!rows.some((r) => r.slug === slug)) return;
    rows = rows.filter((r) => r.slug !== slug);
    logActivity({ action: 'deleted short URL', targetLabel: `/${slug}`, module: 'Short URLs', href: '/short-urls' });
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, rows.map((r) => ({
      item: { id: r.slug, label: `/${r.slug}`, hint: `Short URL · ${r.to.replace(/^https?:\/\//, '').slice(0, 40)}`, href: `/short-urls/${r.slug}` },
      text: `${r.slug} ${r.to}`,
    })));
  },
};
