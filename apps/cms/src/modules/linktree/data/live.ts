import { logActivity } from '../../../lib/data/activity';
import { EDITED_BY, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { LinktreeApi } from './api';
import type { Linktree } from './types';

const SELECT = `*, ${EDITED_BY}` as const;

async function get(): Promise<Linktree> {
  const rows = await unwrap(sb().from('link_cards').select(SELECT).order('sort'));
  const last = rows.length ? toEdited(rows.reduce((a, b) => (b.updated_at > a.updated_at ? b : a))) : { editedBy: '', editedAt: new Date(0).toISOString() };
  return {
    cards: rows.map((r) => ({ id: r.id, title: r.title, display: r.display_url, href: r.url, icon: r.icon, highlighted: r.highlighted, start: r.starts_on ?? '', end: r.ends_on ?? '' })),
    ...last,
  };
}

export const liveLinktree: LinktreeApi = {
  get,
  async save(input) {
    const old = await unwrap(sb().from('link_cards').select('id'));
    const oldIds = new Set(old.map((r) => r.id));
    const keep = new Set(input.cards.map((c) => c.id));
    const goneIds = old.map((r) => r.id).filter((id) => !keep.has(id));
    if (goneIds.length) await unwrap(sb().from('link_cards').delete().in('id', goneIds));
    // The editor gives new cards a temporary id; only ids that exist in the table are updated, the rest are inserted.
    for (const [sort, c] of input.cards.entries()) {
      const row = { title: c.title, display_url: c.display, url: c.href, icon: c.icon, highlighted: c.highlighted, starts_on: c.start || null, ends_on: c.end || null, sort };
      if (oldIds.has(c.id)) await unwrap(sb().from('link_cards').update(row).eq('id', c.id));
      else await unwrap(sb().from('link_cards').insert(row));
    }
    const tree = await get();
    logActivity({ action: 'edited', targetLabel: 'the linktree', detail: `${tree.cards.length} ${tree.cards.length === 1 ? 'card' : 'cards'}`, module: 'Linktree', href: '/linktree' });
    return tree;
  },
  async search(query) {
    const tree = await get();
    return rankSearch(query, [
      ...tree.cards.map((c) => ({ item: { id: c.id, label: c.title, hint: 'Link card', href: '/linktree' }, text: `${c.title} ${c.display} ${c.href}` })),
      { item: { id: 'socials', label: 'Social icon order', hint: 'Linktree', href: '/linktree' }, text: 'social icons order instagram facebook' },
    ]);
  },
};
