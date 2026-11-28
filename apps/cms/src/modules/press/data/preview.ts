import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { PressApi } from './api';
import { press as seed } from './seed';

// The preview database. It lives in memory, so a reload starts again from the seed.
let kit = { ...seed };

export const previewPress: PressApi = {
  async get() { await previewDelay(); return kit; },
  async save(input) {
    await previewDelay();
    previewFailSave();
    kit = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the press kit', module: 'Press kit', href: '/press' });
    return kit;
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, [
      { item: { id: 'logos', label: 'Press kit logos and wordmark', hint: 'Press kit · Assets', href: '/press' }, text: 'press kit logos wordmark brand assets' },
      ...kit.photos.map((p) => ({ item: { id: p.id, label: p.alt.en, hint: `Press kit · ${p.kind === 'team' ? 'Team' : 'Robot'} photo`, href: '/press' }, text: `${p.alt.en} ${p.alt.ro} ${p.file}` })),
      { item: { id: 'descriptions', label: 'Press kit descriptions', hint: 'Press kit · Descriptions', href: '/press' }, text: `press kit description ${kit.shortDescription.en} ${kit.longDescription.en}` },
    ]);
  },
};
