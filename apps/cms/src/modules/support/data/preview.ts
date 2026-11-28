import { logActivity } from '../../../lib/data/activity';
import { seasons } from '../../../lib/data/seed';
import { rankSearch } from '../../../lib/data/search';
import { addPreviewMedia, nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import { slugify } from '../../../lib/slug';
import type { SupportApi } from './api';
import { benefits as seedBenefits, budgets as seedBudgets, docs as seedDocs, sponsors as seedSponsors, tierDefs, tierPlanEdit } from './seed';
import type { SeasonBudget, Sponsor, SupportDocs, TierPlan } from './types';

// The preview database. It lives in memory, so a reload starts again from the seed.
let sponsors: Sponsor[] = seedSponsors.map((x) => ({ ...x }));
addPreviewMedia(seedSponsors.map((s) => s.logo));
addPreviewMedia(['documents/sponsor-deck-2025-26.pdf']);
let plan: TierPlan = { tiers: tierDefs.map((t) => ({ ...t, name: { ...t.name } })), benefits: seedBenefits.map((b) => ({ text: { ...b.text } })), ...tierPlanEdit };
let docs: SupportDocs = { ...seedDocs, decks: seedDocs.decks.map((d) => ({ ...d })) };
let budgets: SeasonBudget[] = seedBudgets.map((b) => ({ ...b, categories: b.categories.map((c) => ({ ...c })) }));
const yearsOf = (season: string) => seasons.find((x) => x.id === season)?.years ?? season;

export const previewSupport: SupportApi = {
  async listSponsors() { await previewDelay(); return [...sponsors]; },
  async createSponsor(input) {
    await previewDelay();
    previewFailSave();
    let id = slugify(input.name) || 'sponsor';
    while (sponsors.some((s) => s.id === id)) id += '-2';
    const s: Sponsor = { ...input, id, editedBy: ME, editedAt: nowIso() };
    sponsors = [...sponsors, s];
    logActivity({ action: 'added sponsor', targetLabel: s.name, module: 'Support', href: `/support/sponsors/${s.id}` });
    return s;
  },
  async updateSponsor(id, input) {
    await previewDelay();
    previewFailSave();
    const old = sponsors.find((s) => s.id === id);
    if (!old) throw new Error('This sponsor no longer exists.');
    const s: Sponsor = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    sponsors = sponsors.map((x) => (x.id === id ? s : x));
    logActivity({ action: 'edited sponsor', targetLabel: s.name, module: 'Support', href: `/support/sponsors/${s.id}` });
    return s;
  },
  async deleteSponsor(id) {
    await previewDelay();
    const old = sponsors.find((s) => s.id === id);
    if (!old) return;
    sponsors = sponsors.filter((s) => s.id !== id);
    logActivity({ action: 'deleted sponsor', targetLabel: old.name, module: 'Support', href: '/support/sponsors' });
  },
  async listTiers() { await previewDelay(); return plan.tiers.map((t) => ({ id: t.id, name: t.name.en, amount: t.amount })); },
  async getTierPlan() { await previewDelay(); return plan; },
  async saveTierPlan(input) {
    await previewDelay();
    previewFailSave();
    const ids = new Set(input.tiers.map((t) => t.id));
    for (const gone of plan.tiers.filter((t) => !ids.has(t.id))) {
      const n = sponsors.filter((s) => s.tier === gone.id).length;
      if (n) throw new Error(`${gone.name.en} still has ${n} ${n === 1 ? 'sponsor' : 'sponsors'}. Move ${n === 1 ? 'it' : 'them'} to another tier first.`);
    }
    plan = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'sponsorship tiers', module: 'Support', href: '/support/tiers' });
    return plan;
  },
  async getDocs() { await previewDelay(); return docs; },
  async saveDocs(input) {
    await previewDelay();
    previewFailSave();
    docs = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'sponsor documents', module: 'Support', href: '/support/documents' });
    return docs;
  },
  async getBudget(season) { await previewDelay(); return budgets.find((b) => b.season === season) ?? null; },
  async saveBudget(season, input) {
    await previewDelay();
    previewFailSave();
    const b: SeasonBudget = { ...input, season, editedBy: ME, editedAt: nowIso() };
    budgets = [...budgets.filter((x) => x.season !== season), b];
    logActivity({ action: 'edited budget of', targetLabel: yearsOf(season), module: 'Support', href: `/support/budget/${season}` });
    return b;
  },

  async search(query) {
    await previewDelay(60);
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
