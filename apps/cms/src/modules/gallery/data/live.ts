import type { Json } from '@brickbot/supabase';
import { logActivity } from '../../../lib/data/activity';
import { fileLeaf } from '../../../lib/data/media';
import { EDITED_BY, bilingual, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { GalleryApi } from './api';
import type { GalleryInput, GalleryItem } from './types';

type J = NonNullable<Json>;
/** The row of a `.single()` query is never null: a miss throws inside `unwrap`. */

const SELECT = `*, ${EDITED_BY}` as const;

type Row = {
  id: string; kind: GalleryItem['kind']; key: string | null; youtube_id: string | null; width: number; height: number;
  season_id: string | null; date: string | null; featured: boolean; alt: unknown; caption: unknown;
  updated_at: string; editor?: { email: string } | null;
};

const map = (r: Row): GalleryItem => ({
  id: r.id, kind: r.kind, key: r.key, youtubeId: r.youtube_id, width: r.width, height: r.height, season: r.season_id,
  date: r.date, featured: r.featured, alt: bilingual(r.alt), caption: bilingual(r.caption), ...toEdited(r),
});
const columns = (i: GalleryInput) => ({
  kind: i.kind, key: i.key, youtube_id: i.youtubeId, width: i.width, height: i.height, season_id: i.season, date: i.date,
  featured: i.featured, alt: i.alt as unknown as J, caption: i.caption as unknown as J,
});
const count = (k: number) => `${k} gallery ${k === 1 ? 'item' : 'items'}`;
/** What an item is called in activity and search: its caption, else the file name, else "YouTube video" (as the preview). */
const itemLabel = (i: Pick<GalleryItem, 'caption' | 'key' | 'kind'>) => i.caption.en.trim() || (i.key ? fileLeaf(i.key) : 'YouTube video');

async function list(): Promise<GalleryItem[]> {
  return (await unwrap(sb().from('gallery_items').select(SELECT).order('updated_at', { ascending: false }))).map((r) => map(r as Row));
}

export const liveGallery: GalleryApi = {
  list,
  async create(input) {
    const it = map(await unwrap(sb().from('gallery_items').insert(columns(input)).select(SELECT).single()) as Row);
    logActivity({ action: 'added gallery item', targetLabel: itemLabel(it), module: 'Gallery', href: `/gallery/${it.id}` });
    return it;
  },
  async createMany(inputs) {
    if (!inputs.length) return [];
    const made = (await unwrap(sb().from('gallery_items').insert(inputs.map(columns)).select(SELECT))).map((r) => map(r as Row));
    logActivity({ action: 'added', targetLabel: count(made.length), detail: 'by upload', module: 'Gallery', href: '/gallery' });
    return made;
  },
  async update(id, input) {
    const old = await unwrap(sb().from('gallery_items').select('id').eq('id', id).maybeSingle());
    if (!old) throw new Error('This gallery item no longer exists.');
    const it = map(await unwrap(sb().from('gallery_items').update(columns(input)).eq('id', id).select(SELECT).single()) as Row);
    logActivity({ action: 'edited gallery item', targetLabel: itemLabel(it), module: 'Gallery', href: `/gallery/${it.id}` });
    return it;
  },
  async remove(id) {
    const old = await unwrap(sb().from('gallery_items').select('key,caption').eq('id', id).maybeSingle());
    if (!old) return;
    await unwrap(sb().from('gallery_items').delete().eq('id', id));
    logActivity({ action: 'deleted gallery item', targetLabel: itemLabel({ caption: bilingual(old.caption), key: old.key, kind: old.key ? 'photo' : 'youtube' }), module: 'Gallery', href: '/gallery' });
  },
  async removeMany(ids) {
    if (!ids.length) return;
    const gone = await unwrap(sb().from('gallery_items').delete().in('id', ids).select('id'));
    logActivity({ action: 'deleted', targetLabel: count(gone.length), module: 'Gallery', href: '/gallery' });
  },
  async bulk(ids, patch) {
    if (!ids.length) return;
    const set: { season_id?: string | null; featured?: boolean } = {};
    if (patch.season !== undefined) set.season_id = patch.season;
    if (patch.featured !== undefined) set.featured = patch.featured;
    const hit = await unwrap(sb().from('gallery_items').update(set).in('id', ids).select('id'));
    const what = patch.featured !== undefined ? (patch.featured ? 'featured' : 'unfeatured') : 'moved to another season:';
    logActivity({ action: what, targetLabel: count(hit.length), module: 'Gallery', href: '/gallery' });
  },
  async search(query) {
    const items = await list();
    return rankSearch(query, items.map((i) => ({ item: { id: i.id, label: itemLabel(i), hint: `Gallery · ${i.kind === 'youtube' ? 'YouTube' : i.kind === 'video' ? 'Clip' : 'Photo'}`, href: `/gallery/${i.id}` }, text: `${i.caption.en} ${i.caption.ro} ${i.alt.en} ${i.key ?? ''}` })));
  },
};
