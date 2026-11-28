import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { addPreviewMedia, nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { SeasonsApi } from './api';
import { awards as seedAwards, eventOverrides, extraEvents, importedEvents } from './seed';
import { seasonStore } from './store';
import type { Award, EventOverride, ExtraEvent } from './types';

// The preview database. It lives in memory, so a reload starts again from the seed.
let overrides: EventOverride[] = eventOverrides.map((x) => ({ ...x }));
let extras: ExtraEvent[] = extraEvents.map((x) => ({ ...x }));
let awards: Award[] = seedAwards.map((x) => ({ ...x }));
addPreviewMedia(seasonStore.seasons.flatMap((s) => [s.gameLogo, s.teamPhoto, s.robot, s.portfolioPdf, s.portfolioCover]));

const label = (id: string) => { const s = seasonStore.seasons.find((x) => x.id === id); return s ? `${s.game} ${s.years}` : id; };
const href = (id: string) => `/seasons/${id}`;
const sortSeasons = () => [...seasonStore.seasons].sort((a, b) => b.years.localeCompare(a.years));
let n = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${n++}`;

export const previewSeasons: SeasonsApi = {
  async list() { await previewDelay(); return sortSeasons(); },
  async update(id, input) {
    await previewDelay();
    previewFailSave();
    const old = seasonStore.seasons.find((s) => s.id === id);
    if (!old) throw new Error('This season no longer exists.');
    const s = { ...old, ...input, editedBy: ME, editedAt: nowIso() };
    seasonStore.seasons = seasonStore.seasons.map((x) => (x.id === id ? s : x));
    addPreviewMedia([s.gameLogo, s.teamPhoto, s.robot, s.portfolioPdf, s.portfolioCover]);
    logActivity({ action: 'edited season', targetLabel: label(id), module: 'Seasons', href: href(id) });
    return s;
  },
  async setCurrent(id) {
    await previewDelay();
    previewFailSave();
    if (!seasonStore.seasons.some((s) => s.id === id)) throw new Error('This season no longer exists.');
    seasonStore.seasons = seasonStore.seasons.map((s) => ({ ...s, current: s.id === id }));
    logActivity({ action: 'made current the season', targetLabel: label(id), module: 'Seasons', href: href(id) });
  },
  async events(season) {
    await previewDelay();
    return { imported: importedEvents.filter((e) => e.season === season), overrides: overrides.filter((o) => o.season === season), extras: extras.filter((e) => e.season === season) };
  },
  async setOverride(season, code, input) {
    await previewDelay();
    previewFailSave();
    const ev = importedEvents.find((e) => e.season === season && e.code === code);
    if (!ev) throw new Error('This event is no longer imported.');
    overrides = [...overrides.filter((o) => !(o.season === season && o.code === code)), { season, code, ...input, editedBy: ME, editedAt: nowIso() }];
    logActivity({ action: 'set a result for', targetLabel: ev.name, module: 'Seasons', href: href(season) });
  },
  async clearOverride(season, code) {
    await previewDelay();
    const ev = importedEvents.find((e) => e.season === season && e.code === code);
    overrides = overrides.filter((o) => !(o.season === season && o.code === code));
    logActivity({ action: 'removed the custom result of', targetLabel: ev?.name ?? code, module: 'Seasons', href: href(season) });
  },
  async saveExtra(season, id, input) {
    await previewDelay();
    previewFailSave();
    const base = { ...input, editedBy: ME, editedAt: nowIso() };
    if (id) {
      const old = extras.find((e) => e.id === id);
      if (!old) throw new Error('This event no longer exists.');
      const e: ExtraEvent = { ...old, ...base };
      extras = extras.map((x) => (x.id === id ? e : x));
      logActivity({ action: 'edited event', targetLabel: e.name.en, module: 'Seasons', href: href(season) });
      return e;
    }
    const e: ExtraEvent = { id: newId('extra'), season, ...base };
    extras = [...extras, e];
    logActivity({ action: 'added event', targetLabel: e.name.en, detail: `to ${label(season)}`, module: 'Seasons', href: href(season) });
    return e;
  },
  async removeExtra(id) {
    await previewDelay();
    const old = extras.find((e) => e.id === id);
    if (!old) return;
    extras = extras.filter((e) => e.id !== id);
    // Awards won there keep their text but lose the link.
    awards = awards.map((a) => (a.extraId === id ? { ...a, extraId: null } : a));
    logActivity({ action: 'deleted event', targetLabel: old.name.en, module: 'Seasons', href: href(old.season) });
  },
  async awards() { await previewDelay(); return [...awards]; },
  async saveAward(id, input) {
    await previewDelay();
    previewFailSave();
    const base = { ...input, editedBy: ME, editedAt: nowIso() };
    if (id) {
      const old = awards.find((a) => a.id === id);
      if (!old) throw new Error('This award no longer exists.');
      const a: Award = { ...old, ...base };
      awards = awards.map((x) => (x.id === id ? a : x));
      logActivity({ action: 'edited award', targetLabel: a.name.en, module: 'Seasons', href: `/seasons/awards?award=${a.id}` });
      return a;
    }
    const a: Award = { id: newId('award'), ...base };
    awards = [...awards, a];
    logActivity({ action: 'added award', targetLabel: a.name.en, detail: `to ${label(a.season)}`, module: 'Seasons', href: `/seasons/awards?award=${a.id}` });
    return a;
  },
  async removeAward(id) {
    await previewDelay();
    const old = awards.find((a) => a.id === id);
    if (!old) return;
    awards = awards.filter((a) => a.id !== id);
    logActivity({ action: 'deleted award', targetLabel: old.name.en, module: 'Seasons', href: '/seasons/awards' });
  },
  async search(query) {
    await previewDelay(60);
    const items = [
      ...seasonStore.seasons.map((s) => ({ item: { id: s.id, label: s.game, hint: `Season · ${s.years}`, href: href(s.id) }, text: `${s.game} ${s.years}` })),
      ...importedEvents.map((e) => ({ item: { id: `${e.season}-${e.code}`, label: e.name, hint: `Event · ${label(e.season)}`, href: href(e.season) }, text: `${e.name} ${e.place}` })),
      ...extras.map((e) => ({ item: { id: e.id, label: e.name.en, hint: `Event · ${label(e.season)}`, href: href(e.season) }, text: `${e.name.en} ${e.name.ro}` })),
      ...awards.map((a) => ({ item: { id: a.id, label: a.name.en, hint: `Award · ${label(a.season)}`, href: `/seasons/awards?award=${a.id}` }, text: `${a.name.en} ${a.name.ro} ${a.event.en}` })),
    ];
    return rankSearch(query, items);
  },
};
