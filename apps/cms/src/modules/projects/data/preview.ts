import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { ProjectsApi } from './api';
import { projects as seed } from './seed';
import type { Project } from './types';

// The preview database. It lives in memory, so a reload starts again from the seed.
let projects: Project[] = seed.map((x) => ({ ...x }));

export const previewProjects: ProjectsApi = {
  async list() { await previewDelay(); return [...projects].sort((a, b) => a.order - b.order); },
  async create(input) {
    await previewDelay();
    previewFailSave();
    if (projects.some((p) => p.slug === input.slug)) throw new Error('Another project already uses that slug.');
    const p: Project = { ...input, id: input.slug, order: Math.max(-1, ...projects.map((x) => x.order)) + 1, editedBy: ME, editedAt: nowIso() };
    projects = [...projects, p];
    logActivity({ action: 'added project', targetLabel: p.name.en, module: 'Projects', href: `/projects/${p.id}` });
    return p;
  },
  async update(id, input) {
    await previewDelay();
    previewFailSave();
    const old = projects.find((p) => p.id === id);
    if (!old) throw new Error('This project no longer exists.');
    if (projects.some((p) => p.id !== id && p.slug === input.slug)) throw new Error('Another project already uses that slug.');
    const p: Project = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    projects = projects.map((x) => (x.id === id ? p : x));
    logActivity({ action: 'edited project', targetLabel: p.name.en, module: 'Projects', href: `/projects/${p.id}` });
    return p;
  },
  async remove(id) {
    await previewDelay();
    const old = projects.find((p) => p.id === id);
    if (!old) return;
    projects = projects.filter((p) => p.id !== id).sort((a, b) => a.order - b.order).map((p, order) => ({ ...p, order }));
    logActivity({ action: 'deleted project', targetLabel: old.name.en, module: 'Projects', href: '/projects' });
  },
  async reorder(ids) {
    await previewDelay();
    projects = projects.map((p) => ({ ...p, order: ids.indexOf(p.id) })).sort((a, b) => a.order - b.order);
    logActivity({ action: 'reordered', targetLabel: 'the projects', module: 'Projects', href: '/projects' });
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, projects.map((p) => ({ item: { id: p.id, label: p.name.en, hint: 'Project', href: `/projects/${p.id}` }, text: `${p.name.en} ${p.name.ro} ${p.summary.en}` })));
  },
};
