import { logActivity } from '../../../lib/data/activity';
import { fileLeaf, registerMediaUsage } from '../../../lib/data/media';
import { rankSearch } from '../../../lib/data/search';
import { addPreviewMedia, nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { GalleryApi } from './api';
import { galleryItems as seed } from './seed';
import type { GalleryItem } from './types';

// The preview database. It lives in memory, so a reload starts again from the seed.
let items: GalleryItem[] = seed.map((x) => ({ ...x }));
addPreviewMedia(seed.map((i) => i.key));
let n = 100;

/** What an item is called in activity and search: its caption, else the file name, else "YouTube video". */
export const itemLabel = (i: Pick<GalleryItem, 'caption' | 'key' | 'kind'>) => i.caption.en.trim() || (i.key ? fileLeaf(i.key) : 'YouTube video');
const byNewest = (a: GalleryItem, b: GalleryItem) => b.editedAt.localeCompare(a.editedAt);
const count = (k: number) => `${k} gallery ${k === 1 ? 'item' : 'items'}`;

registerMediaUsage((key) => items.filter((i) => i.key === key).map((i) => ({ label: itemLabel(i), hint: 'Gallery', href: `/gallery/${i.id}` })));

export const previewGallery: GalleryApi = {
  async list() { await previewDelay(); return [...items].sort(byNewest); },
  async create(input) {
    await previewDelay();
    previewFailSave();
    const it: GalleryItem = { ...input, id: `g${++n}`, editedBy: ME, editedAt: nowIso() };
    items = [it, ...items];
    logActivity({ action: 'added gallery item', targetLabel: itemLabel(it), module: 'Gallery', href: `/gallery/${it.id}` });
    return it;
  },
  async createMany(inputs) {
    await previewDelay();
    previewFailSave();
    const made = inputs.map((x): GalleryItem => ({ ...x, id: `g${++n}`, editedBy: ME, editedAt: nowIso() }));
    items = [...made, ...items];
    logActivity({ action: 'added', targetLabel: count(made.length), detail: 'by upload', module: 'Gallery', href: '/gallery' });
    return made;
  },
  async update(id, input) {
    await previewDelay();
    previewFailSave();
    const old = items.find((i) => i.id === id);
    if (!old) throw new Error('This gallery item no longer exists.');
    const it: GalleryItem = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    items = items.map((x) => (x.id === id ? it : x));
    logActivity({ action: 'edited gallery item', targetLabel: itemLabel(it), module: 'Gallery', href: `/gallery/${it.id}` });
    return it;
  },
  async remove(id) {
    await previewDelay();
    const old = items.find((i) => i.id === id);
    if (!old) return;
    items = items.filter((i) => i.id !== id);
    logActivity({ action: 'deleted gallery item', targetLabel: itemLabel(old), module: 'Gallery', href: '/gallery' });
  },
  async removeMany(ids) {
    await previewDelay();
    previewFailSave();
    const k = items.filter((i) => ids.includes(i.id)).length;
    items = items.filter((i) => !ids.includes(i.id));
    logActivity({ action: 'deleted', targetLabel: count(k), module: 'Gallery', href: '/gallery' });
  },
  async bulk(ids, patch) {
    await previewDelay();
    previewFailSave();
    const hit = items.filter((i) => ids.includes(i.id)).length;
    items = items.map((i) => (ids.includes(i.id) ? { ...i, ...patch, editedBy: ME, editedAt: nowIso() } : i));
    const what = patch.featured !== undefined ? (patch.featured ? 'featured' : 'unfeatured') : 'moved to another season:';
    logActivity({ action: what, targetLabel: count(hit), module: 'Gallery', href: '/gallery' });
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, items.map((i) => ({ item: { id: i.id, label: itemLabel(i), hint: `Gallery · ${i.kind === 'youtube' ? 'YouTube' : i.kind === 'video' ? 'Clip' : 'Photo'}`, href: `/gallery/${i.id}` }, text: `${i.caption.en} ${i.caption.ro} ${i.alt.en} ${i.key ?? ''}` })));
  },
};
