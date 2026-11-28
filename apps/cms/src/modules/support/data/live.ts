import { logActivity } from '../../../lib/data/activity';
import { bilingual, EDITED_BY, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import { slugify } from '../../../lib/slug';
import type { Edited } from '../../../lib/data';
import type { SupportApi } from './api';
import type { Benefit, BudgetCategory, Sponsor, SupportDocs, TierDef, TierPlan } from './types';

type Ed = { updated_at: string; editor?: { email: string } | null };
const SELECT = `*, ${EDITED_BY}` as const;

/** A record made of several rows takes the latest `updated_at` among them (docs/backend.md §8). */
function latest(...groups: Ed[][]): Edited {
  const rows = groups.flat();
  if (!rows.length) return { editedBy: '', editedAt: new Date(0).toISOString() };
  return toEdited(rows.reduce((a, b) => (b.updated_at > a.updated_at ? b : a)));
}

type SponsorRow = Ed & { id: string; name: string; logo: string | null; website: string; season_id: string; tier_id: string };
const mapSponsor = (r: SponsorRow): Sponsor =>
  ({ id: r.id, name: r.name, logo: r.logo, website: r.website, season: r.season_id, tier: r.tier_id, ...toEdited(r) });

const sponsorRow = (i: { name: string; logo: string | null; website: string; season: string; tier: string }) =>
  ({ name: i.name, logo: i.logo, website: i.website, season_id: i.season, tier_id: i.tier });

async function seasonYears(season: string): Promise<string> {
  const rows = await unwrap(sb().from('season_summaries').select('id, years'));
  return rows.find((x) => x.id === season)?.years ?? season;
}

async function listSponsors(): Promise<Sponsor[]> {
  return (await unwrap(sb().from('sponsors').select(SELECT).order('name'))).map(mapSponsor);
}

async function loadPlan(): Promise<TierPlan> {
  const [tiers, benefits] = await Promise.all([
    unwrap(sb().from('sponsor_tiers').select(SELECT).order('sort')),
    unwrap(sb().from('sponsor_benefits').select(SELECT).order('sort')),
  ]);
  return {
    tiers: tiers.map((t): TierDef => ({ id: t.id, name: bilingual(t.name), amount: t.amount, benefits: t.benefits })),
    benefits: benefits.map((b): Benefit => ({ text: bilingual(b.text) })),
    ...latest(tiers, benefits),
  };
}

async function loadDocs(): Promise<SupportDocs> {
  const [doc, decks] = await Promise.all([
    unwrap(sb().from('support_docs').select(SELECT).eq('id', 1).single()),
    unwrap(sb().from('sponsor_decks').select(SELECT).order('season_id')),
  ]);
  return {
    decks: decks.map((d) => ({ season: d.season_id, file: d.file })),
    contract: doc.contract,
    contractText: bilingual(doc.contract_text),
    ...latest([doc], decks),
  };
}

async function loadBudget(season: string) {
  const head = await unwrap(sb().from('season_budgets').select(SELECT).eq('season_id', season).maybeSingle());
  if (!head) return null;
  const lines = await unwrap(sb().from('budget_lines').select(SELECT).eq('season_id', season).order('sort'));
  return {
    season,
    remaining: Number(head.remaining),
    categories: lines.map((l): BudgetCategory => ({ id: l.id, name: bilingual(l.name), amount: Number(l.amount) })),
    ...latest([head], lines),
  };
}

export const liveSupport: SupportApi = {
  listSponsors,
  async createSponsor(input) {
    let id = slugify(input.name) || 'sponsor';
    const taken = new Set((await unwrap(sb().from('sponsors').select('id'))).map((r) => r.id));
    while (taken.has(id)) id += '-2';
    const row = await unwrap(sb().from('sponsors').insert({ id, ...sponsorRow(input) }).select(SELECT).single(), { sponsors_pkey: 'sponsor' });
    logActivity({ action: 'added sponsor', targetLabel: row.name, module: 'Support', href: `/support/sponsors/${row.id}` });
    return mapSponsor(row);
  },
  async updateSponsor(id, input) {
    const row = await unwrap(sb().from('sponsors').update(sponsorRow(input)).eq('id', id).select(SELECT).maybeSingle());
    if (!row) throw new Error('This sponsor no longer exists.');
    logActivity({ action: 'edited sponsor', targetLabel: row.name, module: 'Support', href: `/support/sponsors/${row.id}` });
    return mapSponsor(row);
  },
  async deleteSponsor(id) {
    const gone = (await unwrap(sb().from('sponsors').delete().eq('id', id).select('name'))) ?? [];
    if (gone.length) logActivity({ action: 'deleted sponsor', targetLabel: gone[0].name, module: 'Support', href: '/support/sponsors' });
  },

  async listTiers() {
    const tiers = await unwrap(sb().from('sponsor_tiers').select('id, name, amount').order('sort'));
    return tiers.map((t) => ({ id: t.id, name: bilingual(t.name).en, amount: t.amount }));
  },
  getTierPlan: loadPlan,
  async saveTierPlan(input) {
    const [oldTiers, oldBenefits, sponsors] = await Promise.all([
      unwrap(sb().from('sponsor_tiers').select('*').order('sort')),
      unwrap(sb().from('sponsor_benefits').select('*').order('sort')),
      unwrap(sb().from('sponsors').select('tier_id')),
    ]);
    const ids = new Set(input.tiers.map((t) => t.id));
    for (const gone of oldTiers.filter((t) => !ids.has(t.id))) {
      const n = sponsors.filter((s) => s.tier_id === gone.id).length;
      if (n) throw new Error(`${bilingual(gone.name).en} still has ${n} ${n === 1 ? 'sponsor' : 'sponsors'}. Move ${n === 1 ? 'it' : 'them'} to another tier first.`);
    }
    const goneIds = oldTiers.filter((t) => !ids.has(t.id)).map((t) => t.id);
    if (goneIds.length) await unwrap(sb().from('sponsor_tiers').delete().in('id', goneIds));
    for (const [sort, t] of input.tiers.entries()) {
      await unwrap(sb().from('sponsor_tiers').upsert({ id: t.id, name: t.name, amount: t.amount, benefits: t.benefits, sort }), { sponsor_tiers_pkey: 'tier' });
    }
    // Benefits have no id in the interface: keep rows by position (updating all stamps the edit), add or drop the tail.
    for (const [sort, b] of input.benefits.entries()) {
      const old = oldBenefits[sort];
      if (!old) await unwrap(sb().from('sponsor_benefits').insert({ text: b.text, sort }));
      else await unwrap(sb().from('sponsor_benefits').update({ text: b.text, sort }).eq('id', old.id));
    }
    const extra = oldBenefits.slice(input.benefits.length).map((b) => b.id);
    if (extra.length) await unwrap(sb().from('sponsor_benefits').delete().in('id', extra));
    logActivity({ action: 'edited', targetLabel: 'sponsorship tiers', module: 'Support', href: '/support/tiers' });
    return loadPlan();
  },

  getDocs: loadDocs,
  async saveDocs(input) {
    const old = await unwrap(sb().from('sponsor_decks').select('season_id'));
    const keep = new Set(input.decks.map((d) => d.season));
    const goneIds = old.map((d) => d.season_id).filter((s) => !keep.has(s));
    if (goneIds.length) await unwrap(sb().from('sponsor_decks').delete().in('season_id', goneIds));
    if (input.decks.length) await unwrap(sb().from('sponsor_decks').upsert(input.decks.map((d) => ({ season_id: d.season, file: d.file }))));
    await unwrap(sb().from('support_docs').upsert({ id: 1, contract: input.contract, contract_text: input.contractText }));
    logActivity({ action: 'edited', targetLabel: 'sponsor documents', module: 'Support', href: '/support/documents' });
    return loadDocs();
  },

  getBudget: loadBudget,
  async saveBudget(season, input) {
    await unwrap(sb().from('season_budgets').upsert({ season_id: season, remaining: input.remaining }));
    const old = await unwrap(sb().from('budget_lines').select('id').eq('season_id', season));
    const oldIds = new Set(old.map((l) => l.id));
    const keep = new Set(input.categories.map((c) => c.id));
    const goneIds = old.map((l) => l.id).filter((i) => !keep.has(i));
    if (goneIds.length) await unwrap(sb().from('budget_lines').delete().in('id', goneIds));
    for (const [sort, c] of input.categories.entries()) {
      const row = { season_id: season, name: c.name, amount: c.amount, sort };
      if (oldIds.has(c.id)) await unwrap(sb().from('budget_lines').update(row).eq('id', c.id));
      else await unwrap(sb().from('budget_lines').insert(row));
    }
    logActivity({ action: 'edited budget of', targetLabel: await seasonYears(season), module: 'Support', href: `/support/budget/${season}` });
    return (await loadBudget(season))!;
  },

  async search(query) {
    const [sponsors, plan, seasons] = await Promise.all([
      listSponsors(), loadPlan(), unwrap(sb().from('season_summaries').select('id, years')),
    ]);
    return rankSearch(query, [
      ...sponsors.map((s) => ({
        item: { id: s.id, label: s.name, hint: `Sponsor · ${seasons.find((x) => x.id === s.season)?.years ?? ''}`, href: `/support/sponsors/${s.id}` },
        text: s.name,
      })),
      ...plan.tiers.map((t) => ({
        item: { id: `tier-${t.id}`, label: `${t.name.en} tier`, hint: `Tier · €${t.amount.toLocaleString('en-GB')}`, href: '/support/tiers' },
        text: `${t.name.en} ${t.name.ro} tier tiers pachet sponsorship`,
      })),
      { item: { id: 'docs', label: 'Sponsor deck and sample contract', hint: 'Support · Documents', href: '/support/documents' }, text: 'sponsor deck sample contract documents pdf how contracts work' },
      { item: { id: 'budget', label: 'Budget', hint: 'Support · Spending by season', href: '/support/budget' }, text: 'budget spending categories remaining money eur' },
    ]);
  },
};
