import type { Json } from '@brickbot/supabase';
import { logActivity } from '../../../lib/data/activity';
import { EDITED_BY, bilingual, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { ProjectsApi } from './api';
import type { Project, ProjectInput } from './types';

type J = NonNullable<Json>;
/** The row of a `.single()` query is never null: a miss throws inside `unwrap`. */

const SELECT = `*, ${EDITED_BY}` as const;
const NAMES = { projects_pkey: 'slug', projects_slug_key: 'slug', slug: 'slug' };

type Row = {
  id: string; slug: string; name: unknown; summary: unknown; logo: string | null; external: string | null;
  stats: unknown; body: unknown; facts: unknown; photos: unknown; partners: unknown; sort: number;
  updated_at: string; editor?: { email: string } | null;
};

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const map = (r: Row): Project => {
  const body = (r.body ?? {}) as { en?: unknown; ro?: unknown };
  return {
    id: r.id, slug: r.slug, name: bilingual(r.name), summary: bilingual(r.summary), logo: r.logo, external: r.external,
    stats: r.stats as Project['stats'], body: { en: strings(body.en), ro: strings(body.ro) },
    facts: r.facts as Project['facts'], photos: r.photos as Project['photos'], partners: r.partners as Project['partners'],
    order: r.sort, ...toEdited(r),
  };
};
const columns = (i: ProjectInput) => ({
  slug: i.slug, name: i.name as unknown as J, summary: i.summary as unknown as J, logo: i.logo, external: i.external,
  stats: i.stats as unknown as J, body: i.body as unknown as J, facts: i.facts as unknown as J,
  photos: i.photos as unknown as J, partners: i.partners as unknown as J,
});

async function list(): Promise<Project[]> {
  return (await unwrap(sb().from('projects').select(SELECT).order('sort').order('created_at'))).map((r) => map(r as Row));
}
async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let q = sb().from('projects').select('id').or(`slug.eq.${slug},id.eq.${slug}`);
  if (exceptId) q = q.neq('id', exceptId);
  return (await unwrap(q.limit(1))).length > 0;
}

export const liveProjects: ProjectsApi = {
  list,
  async create(input) {
    if (await slugTaken(input.slug)) throw new Error('Another project already uses that slug.');
    const top = await unwrap(sb().from('projects').select('sort').order('sort', { ascending: false }).limit(1));
    const row = await unwrap(sb().from('projects').insert({ ...columns(input), id: input.slug, sort: (top[0]?.sort ?? -1) + 1 }).select(SELECT).single(), NAMES);
    const p = map(row as Row);
    logActivity({ action: 'added project', targetLabel: p.name.en, module: 'Projects', href: `/projects/${p.id}` });
    return p;
  },
  async update(id, input) {
    const old = await unwrap(sb().from('projects').select('id').eq('id', id).maybeSingle());
    if (!old) throw new Error('This project no longer exists.');
    if (await slugTaken(input.slug, id)) throw new Error('Another project already uses that slug.');
    const row = await unwrap(sb().from('projects').update(columns(input)).eq('id', id).select(SELECT).single(), NAMES);
    const p = map(row as Row);
    logActivity({ action: 'edited project', targetLabel: p.name.en, module: 'Projects', href: `/projects/${p.id}` });
    return p;
  },
  async remove(id) {
    const old = await unwrap(sb().from('projects').select('name').eq('id', id).maybeSingle());
    if (!old) return;
    await unwrap(sb().from('projects').delete().eq('id', id));
    // Close the gap, as the preview does.
    const rest = await unwrap(sb().from('projects').select('id,sort').order('sort').order('created_at'));
    const moved = rest.map((r, i) => ({ id: r.id, sort: i })).filter((r, i) => rest[i].sort !== r.sort);
    await Promise.all(moved.map((m) => unwrap(sb().from('projects').update({ sort: m.sort }).eq('id', m.id))));
    logActivity({ action: 'deleted project', targetLabel: bilingual(old.name).en, module: 'Projects', href: '/projects' });
  },
  async reorder(ids) {
    // The preview gives ids not listed order -1; here they follow the listed ones.
    const all = await unwrap(sb().from('projects').select('id').order('sort'));
    const order = [...ids, ...all.map((r) => r.id).filter((x) => !ids.includes(x))].filter((x) => all.some((r) => r.id === x));
    await Promise.all(order.map((id, sort) => unwrap(sb().from('projects').update({ sort }).eq('id', id))));
    logActivity({ action: 'reordered', targetLabel: 'the projects', module: 'Projects', href: '/projects' });
  },
  async search(query) {
    const rows = await list();
    return rankSearch(query, rows.map((p) => ({ item: { id: p.id, label: p.name.en, hint: 'Project', href: `/projects/${p.id}` }, text: `${p.name.en} ${p.name.ro} ${p.summary.en}` })));
  },
};
