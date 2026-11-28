import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import { slugify } from '../../../lib/slug';
import type { HomeFaqApi } from './api';
import { faq as seedFaq, form230 as seedForm230, hero as seedHero } from './seed';

// The preview database. It lives in memory, so a reload starts again from the seed.
let hero = { ...seedHero };
let faq = seedFaq.map((x) => ({ ...x }));
let form230 = { ...seedForm230 };

const sorted = () => [...faq].sort((a, b) => a.order - b.order);

export const previewHomeFaq: HomeFaqApi = {
  async getHero() { await previewDelay(); return hero; },
  async saveHero(input) {
    await previewDelay();
    previewFailSave();
    hero = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the home hero', module: 'Home & FAQ', href: '/home-faq/hero' });
    return hero;
  },
  async listFaq() { await previewDelay(); return sorted(); },
  async createFaq(input) {
    await previewDelay();
    previewFailSave();
    let id = slugify(input.question.en) || 'question';
    while (faq.some((x) => x.id === id)) id += '-2';
    const x = { ...input, id, order: Math.max(-1, ...faq.map((q) => q.order)) + 1, editedBy: ME, editedAt: nowIso() };
    faq = [...faq, x];
    logActivity({ action: 'added FAQ question', targetLabel: x.question.en, module: 'Home & FAQ', href: `/home-faq/faq/${x.id}` });
    return x;
  },
  async updateFaq(id, input) {
    await previewDelay();
    previewFailSave();
    const old = faq.find((x) => x.id === id);
    if (!old) throw new Error('This question no longer exists.');
    const x = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    faq = faq.map((y) => (y.id === id ? x : y));
    logActivity({ action: 'edited FAQ question', targetLabel: x.question.en, module: 'Home & FAQ', href: `/home-faq/faq/${x.id}` });
    return x;
  },
  async deleteFaq(id) {
    await previewDelay();
    const old = faq.find((x) => x.id === id);
    if (!old) return;
    faq = sorted().filter((x) => x.id !== id).map((x, order) => ({ ...x, order }));
    logActivity({ action: 'deleted FAQ question', targetLabel: old.question.en, module: 'Home & FAQ', href: '/home-faq/faq' });
  },
  async reorderFaq(ids) {
    await previewDelay();
    faq = faq.map((x) => ({ ...x, order: ids.indexOf(x.id) })).sort((a, b) => a.order - b.order);
    logActivity({ action: 'reordered', targetLabel: 'the FAQ', module: 'Home & FAQ', href: '/home-faq/faq' });
  },
  async getForm230() { await previewDelay(); return form230; },
  async saveForm230(input) {
    await previewDelay();
    previewFailSave();
    form230 = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the Form 230 callout', module: 'Home & FAQ', href: '/home-faq/form-230' });
    return form230;
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, faq.map((x) => ({ item: { id: x.id, label: x.question.en, hint: 'FAQ question', href: `/home-faq/faq/${x.id}` }, text: `${x.question.en} ${x.question.ro}` })));
  },
};
