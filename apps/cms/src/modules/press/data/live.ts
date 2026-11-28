import type { Database } from '@brickbot/supabase';
type Json = Database['public']['Tables']['press_kit']['Insert']['marks'];
import { logActivity } from '../../../lib/data/activity';
import { bilingual, EDITED_BY, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { PressApi } from './api';
import type { PressKit, PressMarks, PressPhoto } from './types';

const KEYS: (keyof PressMarks)[] = ['logoSvgDark', 'logoSvgLight', 'logoPngDark', 'logoPngLight', 'wordmarkSvgDark', 'wordmarkSvgLight', 'wordmarkPngDark', 'wordmarkPngLight'];

const SELECT = `*, ${EDITED_BY}` as const;
async function get(): Promise<PressKit> {
  const r = await unwrap(sb().from('press_kit').select(SELECT).eq('id', 1).single());
  const raw = (r.marks && typeof r.marks === 'object' ? r.marks : {}) as Record<string, unknown>;
  const marks = Object.fromEntries(KEYS.map((k) => [k, typeof raw[k] === 'string' ? raw[k] : null])) as unknown as PressMarks;
  const photos = (Array.isArray(r.photos) ? r.photos : []) as unknown as (Omit<PressPhoto, 'alt'> & { alt: unknown })[];
  return {
    marks,
    photos: photos.map((p) => ({ id: p.id, kind: p.kind, file: p.file, alt: bilingual(p.alt) })),
    shortDescription: bilingual(r.short_description),
    longDescription: bilingual(r.long_description),
    contactEmail: r.contact_email,
    ...toEdited(r),
  };
}

export const livePress: PressApi = {
  get,
  async save(input) {
    await unwrap(sb().from('press_kit').upsert({
      id: 1, marks: input.marks as unknown as Json, photos: input.photos as unknown as Json, short_description: input.shortDescription,
      long_description: input.longDescription, contact_email: input.contactEmail,
    }));
    logActivity({ action: 'edited', targetLabel: 'the press kit', module: 'Press kit', href: '/press' });
    return get();
  },
  async search(query) {
    const kit = await get();
    return rankSearch(query, [
      { item: { id: 'logos', label: 'Press kit logos and wordmark', hint: 'Press kit · Assets', href: '/press' }, text: 'press kit logos wordmark brand assets' },
      ...kit.photos.map((p) => ({ item: { id: p.id, label: p.alt.en, hint: `Press kit · ${p.kind === 'team' ? 'Team' : 'Robot'} photo`, href: '/press' }, text: `${p.alt.en} ${p.alt.ro} ${p.file}` })),
      { item: { id: 'descriptions', label: 'Press kit descriptions', hint: 'Press kit · Descriptions', href: '/press' }, text: `press kit description ${kit.shortDescription.en} ${kit.longDescription.en}` },
    ]);
  },
};
