import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { addPreviewMedia, nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { LinktreeApi } from './api';
import { cards as seedCards, edit } from './seed';
import type { Linktree } from './types';

let tree: Linktree = { cards: seedCards.map((c) => ({ ...c })), ...edit };
addPreviewMedia(seedCards.map((c) => c.icon));

export const previewLinktree: LinktreeApi = {
  async get() { await previewDelay(); return tree; },
  async save(input) {
    await previewDelay();
    previewFailSave();
    tree = { cards: input.cards.map((c) => ({ ...c })), editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the linktree', detail: `${tree.cards.length} ${tree.cards.length === 1 ? 'card' : 'cards'}`, module: 'Linktree', href: '/linktree' });
    return tree;
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, [
      ...tree.cards.map((c) => ({ item: { id: c.id, label: c.title, hint: 'Link card', href: '/linktree' }, text: `${c.title} ${c.display} ${c.href}` })),
      { item: { id: 'socials', label: 'Social icon order', hint: 'Linktree', href: '/linktree' }, text: 'social icons order instagram facebook' },
    ]);
  },
};
