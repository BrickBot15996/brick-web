import { logActivity } from '../../../lib/data/activity';
import { bilingual, EDITED_BY, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { HomeFaqApi } from './api';
import type { Faq, Form230, Hero } from './types';

const SELECT = `*, ${EDITED_BY}` as const;
type Ed = { updated_at: string; editor?: { email: string } | null };
type FaqRow = Ed & { id: string; question: unknown; answer: unknown; sort: number };
const mapFaq = (r: FaqRow): Faq => ({ id: r.id, question: bilingual(r.question), answer: bilingual(r.answer), order: r.sort, ...toEdited(r) });

async function getHero(): Promise<Hero> {
  const r = await unwrap(sb().from('home_hero').select(SELECT).eq('id', 1).single());
  return { tagline: bilingual(r.tagline), intro: bilingual(r.intro), mediaType: r.media_type === 'video' ? 'video' : 'image', media: r.media, poster: r.poster, ...toEdited(r) };
}
async function getForm230(): Promise<Form230> {
  const r = await unwrap(sb().from('form230_callout').select(SELECT).eq('id', 1).single());
  return { start: r.starts_on, end: r.ends_on, text: bilingual(r.text), link: r.link, ...toEdited(r) };
}
async function listFaq(): Promise<Faq[]> {
  return (await unwrap(sb().from('faq_items').select(SELECT).order('sort'))).map(mapFaq);
}

export const liveHomeFaq: HomeFaqApi = {
  getHero,
  async saveHero(input) {
    await unwrap(sb().from('home_hero').upsert({ id: 1, tagline: input.tagline, intro: input.intro, media_type: input.mediaType, media: input.media, poster: input.poster }));
    logActivity({ action: 'edited', targetLabel: 'the home hero', module: 'Home & FAQ', href: '/home-faq/hero' });
    return getHero();
  },
  listFaq,
  async createFaq(input) {
    const last = await unwrap(sb().from('faq_items').select('sort').order('sort', { ascending: false }).limit(1));
    const sort = (last[0]?.sort ?? -1) + 1;
    const row = await unwrap(sb().from('faq_items').insert({ question: input.question, answer: input.answer, sort }).select(SELECT).single());
    logActivity({ action: 'added FAQ question', targetLabel: bilingual(row.question).en, module: 'Home & FAQ', href: `/home-faq/faq/${row.id}` });
    return mapFaq(row);
  },
  async updateFaq(id, input) {
    const row = await unwrap(sb().from('faq_items').update({ question: input.question, answer: input.answer }).eq('id', id).select(SELECT).maybeSingle());
    if (!row) throw new Error('This question no longer exists.');
    logActivity({ action: 'edited FAQ question', targetLabel: bilingual(row.question).en, module: 'Home & FAQ', href: `/home-faq/faq/${row.id}` });
    return mapFaq(row);
  },
  async deleteFaq(id) {
    const gone = (await unwrap(sb().from('faq_items').delete().eq('id', id).select('question'))) ?? [];
    if (!gone.length) return;
    const rest = await unwrap(sb().from('faq_items').select('id, sort').order('sort'));
    for (const [sort, r] of rest.entries()) if (r.sort !== sort) await unwrap(sb().from('faq_items').update({ sort }).eq('id', r.id));
    logActivity({ action: 'deleted FAQ question', targetLabel: bilingual(gone[0].question).en, module: 'Home & FAQ', href: '/home-faq/faq' });
  },
  async reorderFaq(ids) {
    const rows = await unwrap(sb().from('faq_items').select('id, sort'));
    // Like the preview: ids not listed get -1 and sort first.
    for (const r of rows) {
      const sort = ids.indexOf(r.id);
      if (sort !== r.sort) await unwrap(sb().from('faq_items').update({ sort }).eq('id', r.id));
    }
    logActivity({ action: 'reordered', targetLabel: 'the FAQ', module: 'Home & FAQ', href: '/home-faq/faq' });
  },
  getForm230,
  async saveForm230(input) {
    await unwrap(sb().from('form230_callout').upsert({ id: 1, starts_on: input.start, ends_on: input.end, text: input.text, link: input.link }));
    logActivity({ action: 'edited', targetLabel: 'the Form 230 callout', module: 'Home & FAQ', href: '/home-faq/form-230' });
    return getForm230();
  },
  async search(query) {
    const faq = await listFaq();
    return rankSearch(query, faq.map((x) => ({ item: { id: x.id, label: x.question.en, hint: 'FAQ question', href: `/home-faq/faq/${x.id}` }, text: `${x.question.en} ${x.question.ro}` })));
  },
};
