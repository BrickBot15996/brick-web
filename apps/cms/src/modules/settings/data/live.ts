import { logActivity } from '../../../lib/data/activity';
import { bilingual, EDITED_BY, fail, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { SettingsApi } from './api';
import { SECTIONS } from './preview';
import type { Network, SiteSettings } from './types';


const SELECT = `*, ${EDITED_BY}` as const;
const NETWORKS: Network[] = ['website', 'instagram', 'facebook', 'tiktok', 'linkedin', 'email', 'youtube', 'github'];

async function get(): Promise<SiteSettings> {
  const [r, socials] = await Promise.all([
    // A cms.links-only member may read the socials but not the rest (RLS): then the record is blank and only `socials` is used (Linktree).
    unwrap(sb().from('site_settings').select(SELECT).eq('id', 1).maybeSingle()),
    unwrap(sb().from('social_links').select(SELECT).order('sort')),
  ]);
  const edited = [...(r ? [r] : []), ...socials];
  const last = edited.length ? toEdited(edited.reduce((a, b) => (b.updated_at > a.updated_at ? b : a))) : { editedBy: '', editedAt: new Date(0).toISOString() };
  return {
    email: r?.email ?? '',
    address: bilingual(r?.address),
    mapsEmbed: r?.maps_embed ?? '',
    mapsLink: r?.maps_link ?? '',
    association: { name: r?.association_name ?? '', cif: r?.cif ?? '', bank: r?.bank ?? '', branch: bilingual(r?.branch), iban: r?.iban ?? '' },
    socials: socials.map((s) => ({ network: s.network as Network, url: s.url })),
    ...last,
  };
}

export const liveSettings: SettingsApi = {
  get,
  async save(input) {
    const a = input.association;
    await unwrap(sb().from('site_settings').upsert({
      id: 1, email: input.email, address: input.address, maps_embed: input.mapsEmbed, maps_link: input.mapsLink,
      association_name: a.name, cif: a.cif, bank: a.bank, branch: a.branch, iban: a.iban,
    }));
    const keep = new Set<string>(input.socials.map((s) => s.network));
    const gone = NETWORKS.filter((n) => !keep.has(n));
    if (gone.length) await unwrap(sb().from('social_links').delete().in('network', gone));
    if (input.socials.length) await unwrap(sb().from('social_links').upsert(input.socials.map((s, sort) => ({ network: s.network, url: s.url, sort }))));
    logActivity({ action: 'edited', targetLabel: 'site settings', module: 'Site settings', href: '/settings' });
    return get();
  },
  async reorderSocials(order) {
    const { error } = await sb().rpc('reorder_socials', { p_order: order });
    if (error) fail(error);
    logActivity({ action: 'reordered', targetLabel: 'social icons', module: 'Linktree', href: '/linktree' });
    return get();
  },
  async search(query) {
    return rankSearch(query, SECTIONS.map((s) => ({
      item: { id: s.id, label: s.label, hint: 'Site settings', href: `/settings#${s.id}` },
      text: `${s.label} ${s.text}`,
    })));
  },
};
