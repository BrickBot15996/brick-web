import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import { slugify } from '../../../lib/slug';
import type { TeamApi } from './api';
import { impact as seedImpact, join as seedJoin, milestones as seedMilestones, mission as seedMission } from './seed';

// The preview database. It lives in memory, so a reload starts again from the seed.
let milestones = seedMilestones.map((m) => ({ ...m }));
let mission = { ...seedMission };
let impact = { ...seedImpact };
let join = { ...seedJoin };

const byDate = (a: { when: string }, b: { when: string }) => a.when.localeCompare(b.when);

export const previewTeam: TeamApi = {
  async listMilestones() { await previewDelay(); return [...milestones].sort(byDate); },
  async createMilestone(input) {
    await previewDelay();
    previewFailSave();
    let id = slugify(`${input.title.en}-${input.when.slice(0, 4)}`) || 'milestone';
    while (milestones.some((m) => m.id === id)) id += '-2';
    const m = { ...input, id, editedBy: ME, editedAt: nowIso() };
    milestones = [...milestones, m];
    logActivity({ action: 'added milestone', targetLabel: m.title.en, module: 'Team & story', href: `/team/timeline/${m.id}` });
    return m;
  },
  async updateMilestone(id, input) {
    await previewDelay();
    previewFailSave();
    const old = milestones.find((m) => m.id === id);
    if (!old) throw new Error('This milestone no longer exists.');
    const m = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    milestones = milestones.map((x) => (x.id === id ? m : x));
    logActivity({ action: 'edited milestone', targetLabel: m.title.en, module: 'Team & story', href: `/team/timeline/${m.id}` });
    return m;
  },
  async deleteMilestone(id) {
    await previewDelay();
    const old = milestones.find((m) => m.id === id);
    if (!old) return;
    milestones = milestones.filter((m) => m.id !== id);
    logActivity({ action: 'deleted milestone', targetLabel: old.title.en, module: 'Team & story', href: '/team/timeline' });
  },
  async getMission() { await previewDelay(); return mission; },
  async saveMission(input) {
    await previewDelay();
    previewFailSave();
    mission = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the mission text', module: 'Team & story', href: '/team/mission' });
    return mission;
  },
  async getImpact() { await previewDelay(); return impact; },
  async saveImpact(input) {
    await previewDelay();
    previewFailSave();
    impact = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the impact numbers', module: 'Team & story', href: '/team/impact' });
    return impact;
  },
  async getJoin() { await previewDelay(); return join; },
  async saveJoin(input) {
    await previewDelay();
    previewFailSave();
    join = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'the Join page', module: 'Team & story', href: '/team/join' });
    return join;
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, [
      ...milestones.map((m) => ({ item: { id: m.id, label: m.title.en, hint: `Milestone · ${m.when.slice(0, 4)}`, href: `/team/timeline/${m.id}` }, text: `${m.title.en} ${m.title.ro} ${m.when}` })),
      ...join.departments.map((d) => ({ item: { id: d.id, label: d.name.en, hint: 'Join page · Department', href: '/team/join' }, text: `${d.name.en} ${d.name.ro}` })),
    ]);
  },
};
