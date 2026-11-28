import type { Json } from '@brickbot/supabase';
import { logActivity } from '../../../lib/data/activity';
import { EDITED_BY, bilingual, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { Edited } from '../../../lib/data/types';
import { slugify } from '../../../lib/slug';
import type { TeamApi } from './api';
import type { Department, ImpactNumber, Milestone, Value } from './types';

type J = NonNullable<Json>;
/** The row of a `.single()` query is never null: a miss throws inside `unwrap`. */

const SELECT = `*, ${EDITED_BY}` as const;
type Editable = { updated_at: string; editor?: { email: string } | null };

/** The most recent of several rows' stamps. */
function latest(rows: Editable[]): Edited {
  const r = rows.reduce<Editable | null>((a, b) => (!a || b.updated_at > a.updated_at ? b : a), null);
  return r ? toEdited(r) : { editedBy: '', editedAt: new Date(0).toISOString() };
}

type MRow = Editable & { id: string; occurred_on: string; title: unknown; text: unknown; image: string | null };
const mapMilestone = (r: MRow): Milestone => ({ id: r.id, when: r.occurred_on, title: bilingual(r.title), text: bilingual(r.text), image: r.image, ...toEdited(r) });
const byDate = (a: { when: string }, b: { when: string }) => a.when.localeCompare(b.when);
const columns = (i: { when: string; title: unknown; text: unknown; image: string | null }) => ({
  occurred_on: i.when, title: i.title as J, text: i.text as J, image: i.image,
});

async function milestones(): Promise<Milestone[]> {
  return (await unwrap(sb().from('timeline_milestones').select(SELECT))).map((r) => mapMilestone(r as MRow)).sort(byDate);
}

type TeamRow = Editable & { mission: unknown; drive: unknown; values: unknown; students_do: unknown; team_photo: string | null };
const mapMission = (r: TeamRow) => ({ mission: bilingual(r.mission), drive: bilingual(r.drive), values: (Array.isArray(r.values) ? r.values : []) as Value[], studentsDo: bilingual(r.students_do), teamPhoto: r.team_photo, ...toEdited(r) });
type DRow = Editable & { id: string; name: unknown; description: unknown; photos: unknown; sort: number };
const mapDepartment = (r: DRow): Department => ({ id: r.id, name: bilingual(r.name), description: bilingual(r.description), photos: (r.photos ?? []) as Department['photos'] });
const NAMES = { departments_pkey: 'department' };

async function getJoin() {
  const [page, deps] = await Promise.all([
    unwrap(sb().from('join_page').select(SELECT).eq('id', 1).single()),
    unwrap(sb().from('departments').select(SELECT).order('sort')),
  ]);
  return { requirements: bilingual((page as unknown as { requirements: unknown }).requirements), departments: deps.map((d) => mapDepartment(d as DRow)), ...latest([page as unknown as Editable, ...(deps as Editable[])]) };
}

export const liveTeam: TeamApi = {
  listMilestones: milestones,
  async createMilestone(input) {
    const taken = new Set((await unwrap(sb().from('timeline_milestones').select('id'))).map((r) => r.id));
    let id = slugify(`${input.title.en}-${input.when.slice(0, 4)}`) || 'milestone';
    while (taken.has(id)) id += '-2';
    const m = mapMilestone(await unwrap(sb().from('timeline_milestones').insert({ ...columns(input), id }).select(SELECT).single()));
    logActivity({ action: 'added milestone', targetLabel: m.title.en, module: 'Team & story', href: `/team/timeline/${m.id}` });
    return m;
  },
  async updateMilestone(id, input) {
    const old = await unwrap(sb().from('timeline_milestones').select('id').eq('id', id).maybeSingle());
    if (!old) throw new Error('This milestone no longer exists.');
    const m = mapMilestone(await unwrap(sb().from('timeline_milestones').update(columns(input)).eq('id', id).select(SELECT).single()));
    logActivity({ action: 'edited milestone', targetLabel: m.title.en, module: 'Team & story', href: `/team/timeline/${m.id}` });
    return m;
  },
  async deleteMilestone(id) {
    const old = await unwrap(sb().from('timeline_milestones').select('title').eq('id', id).maybeSingle());
    if (!old) return;
    await unwrap(sb().from('timeline_milestones').delete().eq('id', id));
    logActivity({ action: 'deleted milestone', targetLabel: bilingual(old.title).en, module: 'Team & story', href: '/team/timeline' });
  },

  async getMission() {
    return mapMission(await unwrap(sb().from('team_page').select(SELECT).eq('id', 1).single()));
  },
  async saveMission(input) {
    const r = await unwrap(sb().from('team_page').upsert({
      id: 1, mission: input.mission as unknown as J, drive: input.drive as unknown as J, values: input.values as unknown as J,
      students_do: input.studentsDo as unknown as J, team_photo: input.teamPhoto,
    }).select(SELECT).single());
    logActivity({ action: 'edited', targetLabel: 'the mission text', module: 'Team & story', href: '/team/mission' });
    return mapMission(r);
  },

  async getImpact() {
    const rows = await unwrap(sb().from('impact_numbers').select(SELECT).order('sort'));
    return {
      numbers: rows.map((r): ImpactNumber => ({ id: r.id as ImpactNumber['id'], value: r.value, suffix: r.suffix, label: bilingual(r.label) })),
      ...latest(rows as Editable[]),
    };
  },
  async saveImpact(input) {
    await unwrap(sb().from('impact_numbers').upsert(input.numbers.map((n, sort) => ({
      id: n.id, value: n.value, suffix: n.suffix, label: n.label as unknown as J, sort,
    }))));
    logActivity({ action: 'edited', targetLabel: 'the impact numbers', module: 'Team & story', href: '/team/impact' });
    return liveTeam.getImpact();
  },

  getJoin,
  async saveJoin(input) {
    await unwrap(sb().from('join_page').upsert({ id: 1, requirements: input.requirements as unknown as J }));
    const have = await unwrap(sb().from('departments').select('id'));
    const keep = new Set(input.departments.map((d) => d.id));
    const gone = have.map((d) => d.id).filter((id) => !keep.has(id));
    if (gone.length) await unwrap(sb().from('departments').delete().in('id', gone));
    if (input.departments.length) {
      await unwrap(sb().from('departments').upsert(input.departments.map((d, sort) => ({
        id: d.id, name: d.name as unknown as J, description: d.description as unknown as J, photos: d.photos as unknown as J, sort,
      }))), NAMES);
    }
    logActivity({ action: 'edited', targetLabel: 'the Join page', module: 'Team & story', href: '/team/join' });
    return getJoin();
  },

  async search(query) {
    const [ms, join] = await Promise.all([milestones(), getJoin()]);
    return rankSearch(query, [
      ...ms.map((m) => ({ item: { id: m.id, label: m.title.en, hint: `Milestone · ${m.when.slice(0, 4)}`, href: `/team/timeline/${m.id}` }, text: `${m.title.en} ${m.title.ro} ${m.when}` })),
      ...join.departments.map((d) => ({ item: { id: d.id, label: d.name.en, hint: 'Join page · Department', href: '/team/join' }, text: `${d.name.en} ${d.name.ro}` })),
    ]);
  },
};
