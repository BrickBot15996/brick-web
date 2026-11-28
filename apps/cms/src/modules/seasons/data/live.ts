import type { Json } from '@brickbot/supabase';
import { logActivity } from '../../../lib/data/activity';
import { EDITED_BY, bilingual, fail, sb, toEdited, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { SeasonsApi } from './api';
import type { Award, EventOverride, ExtraEvent, SeasonRecord } from './types';

type J = NonNullable<Json>;
/** The row of a `.single()` query is never null: a miss throws inside `unwrap`. */

const SELECT = `*, ${EDITED_BY}` as const;
type Stamp = { updated_at: string; editor?: { email: string } | null };

type SeasonRow = Stamp & {
  id: string; game: string; years: string; ftc: number | null; current: boolean; game_logo: string | null; team_photo: string | null;
  robot: string | null; onshape: string; portfolio_pdf: string | null; portfolio_cover: string | null;
};
const mapSeason = (r: SeasonRow): SeasonRecord => ({
  id: r.id, game: r.game, years: r.years, ftc: r.ftc, current: r.current, gameLogo: r.game_logo, teamPhoto: r.team_photo, robot: r.robot,
  onshape: r.onshape, portfolioPdf: r.portfolio_pdf, portfolioCover: r.portfolio_cover, ...toEdited(r),
});

type OverrideRow = Stamp & { season_id: string; code: string; rank: number | null; result: unknown; note: string };
const mapOverride = (r: OverrideRow): EventOverride => ({ season: r.season_id, code: r.code, rank: r.rank, result: bilingual(r.result), note: r.note, ...toEdited(r) });

type ExtraRow = Stamp & { id: string; season_id: string; name: unknown; date: string; place: unknown; place_url: string; result: unknown };
const mapExtra = (r: ExtraRow): ExtraEvent => ({
  id: r.id, season: r.season_id, name: bilingual(r.name), date: r.date, place: bilingual(r.place), placeUrl: r.place_url, result: bilingual(r.result), ...toEdited(r),
});

type AwardRow = Stamp & { id: string; season_id: string; name: unknown; event: unknown; event_code: string | null; extra_id: string | null; type: string | null };
const mapAward = (r: AwardRow): Award => ({
  id: r.id, season: r.season_id, name: bilingual(r.name), event: bilingual(r.event), eventCode: r.event_code, extraId: r.extra_id, type: r.type, ...toEdited(r),
});

const extraColumns = (i: { name: unknown; date: string; place: unknown; placeUrl: string; result: unknown }) => ({
  name: i.name as J, date: i.date, place: i.place as J, place_url: i.placeUrl, result: i.result as J,
});
const awardColumns = (i: { season: string; name: unknown; event: unknown; eventCode: string | null; extraId: string | null; type: string | null }) => ({
  season_id: i.season, name: i.name as J, event: i.event as J, event_code: i.eventCode, extra_id: i.extraId, type: i.type,
});

async function seasons(): Promise<SeasonRecord[]> {
  return (await unwrap(sb().from('seasons').select(SELECT).order('start_year', { ascending: false }))).map((r) => mapSeason(r as SeasonRow));
}
async function awards(): Promise<Award[]> {
  return (await unwrap(sb().from('awards').select(SELECT).order('created_at').order('id'))).map((r) => mapAward(r as AwardRow));
}
/** "DECODE 2025–26", as the preview labels a season in activity. */
async function label(id: string): Promise<string> {
  const s = await unwrap(sb().from('seasons').select('game,years').eq('id', id).maybeSingle());
  return s ? `${s.game} ${s.years}` : id;
}
const href = (id: string) => `/seasons/${id}`;
const seasonSearchLabel = (list: SeasonRecord[], id: string) => { const s = list.find((x) => x.id === id); return s ? `${s.game} ${s.years}` : id; };

export const liveSeasons: SeasonsApi = {
  list: seasons,
  async update(id, input) {
    const old = await unwrap(sb().from('seasons').select('id').eq('id', id).maybeSingle());
    if (!old) throw new Error('This season no longer exists.');
    const row = await unwrap(sb().from('seasons').update({
      game: input.game, years: input.years, ftc: input.ftc, game_logo: input.gameLogo, team_photo: input.teamPhoto, robot: input.robot,
      onshape: input.onshape, portfolio_pdf: input.portfolioPdf, portfolio_cover: input.portfolioCover,
    }).eq('id', id).select(SELECT).single());
    const s = mapSeason(row as SeasonRow);
    logActivity({ action: 'edited season', targetLabel: `${s.game} ${s.years}`, module: 'Seasons', href: href(id) });
    return s;
  },
  async setCurrent(id) {
    const { error } = await sb().rpc('set_current_season', { p_id: id });
    if (error) {
      if (error.code === 'P0002') throw new Error('This season no longer exists.');
      fail(error);
    }
    logActivity({ action: 'made current the season', targetLabel: await label(id), module: 'Seasons', href: href(id) });
  },
  // Imported FTC Events data is not stored in the database (the website reads it at build time), so the CMS has none to show.
  async events(season) {
    const [ov, ex] = await Promise.all([
      unwrap(sb().from('season_event_overrides').select(SELECT).eq('season_id', season).order('code')),
      unwrap(sb().from('season_events').select(SELECT).eq('season_id', season).order('created_at').order('id')),
    ]);
    return { imported: [], overrides: ov.map((r) => mapOverride(r as OverrideRow)), extras: ex.map((r) => mapExtra(r as ExtraRow)) };
  },
  async setOverride(season, code, input) {
    await unwrap(sb().from('season_event_overrides').upsert(
      { season_id: season, code, rank: input.rank, result: input.result as unknown as J, note: input.note },
      { onConflict: 'season_id,code' },
    ));
    logActivity({ action: 'set a result for', targetLabel: code, module: 'Seasons', href: href(season) });
  },
  async clearOverride(season, code) {
    await unwrap(sb().from('season_event_overrides').delete().eq('season_id', season).eq('code', code));
    logActivity({ action: 'removed the custom result of', targetLabel: code, module: 'Seasons', href: href(season) });
  },
  async saveExtra(season, id, input) {
    if (id) {
      const old = await unwrap(sb().from('season_events').select('id').eq('id', id).maybeSingle());
      if (!old) throw new Error('This event no longer exists.');
      const e = mapExtra(await unwrap(sb().from('season_events').update(extraColumns(input)).eq('id', id).select(SELECT).single()));
      logActivity({ action: 'edited event', targetLabel: e.name.en, module: 'Seasons', href: href(season) });
      return e;
    }
    const e = mapExtra(await unwrap(sb().from('season_events').insert({ ...extraColumns(input), season_id: season }).select(SELECT).single()));
    logActivity({ action: 'added event', targetLabel: e.name.en, detail: `to ${await label(season)}`, module: 'Seasons', href: href(season) });
    return e;
  },
  async removeExtra(id) {
    const old = await unwrap(sb().from('season_events').select('name,season_id').eq('id', id).maybeSingle());
    if (!old) return;
    // Awards won there keep their text but lose the link (the database sets extra_id to null).
    await unwrap(sb().from('season_events').delete().eq('id', id));
    logActivity({ action: 'deleted event', targetLabel: bilingual(old.name).en, module: 'Seasons', href: href(old.season_id) });
  },
  awards,
  async saveAward(id, input) {
    if (id) {
      const old = await unwrap(sb().from('awards').select('id').eq('id', id).maybeSingle());
      if (!old) throw new Error('This award no longer exists.');
      const a = mapAward(await unwrap(sb().from('awards').update(awardColumns(input)).eq('id', id).select(SELECT).single()));
      logActivity({ action: 'edited award', targetLabel: a.name.en, module: 'Seasons', href: `/seasons/awards?award=${a.id}` });
      return a;
    }
    const a = mapAward(await unwrap(sb().from('awards').insert(awardColumns(input)).select(SELECT).single()));
    logActivity({ action: 'added award', targetLabel: a.name.en, detail: `to ${await label(a.season)}`, module: 'Seasons', href: `/seasons/awards?award=${a.id}` });
    return a;
  },
  async removeAward(id) {
    const old = await unwrap(sb().from('awards').select('name').eq('id', id).maybeSingle());
    if (!old) return;
    await unwrap(sb().from('awards').delete().eq('id', id));
    logActivity({ action: 'deleted award', targetLabel: bilingual(old.name).en, module: 'Seasons', href: '/seasons/awards' });
  },
  async search(query) {
    const [ss, ex, aw] = await Promise.all([
      seasons(),
      unwrap(sb().from('season_events').select(SELECT)),
      awards(),
    ]);
    const extras = ex.map((r) => mapExtra(r as ExtraRow));
    return rankSearch(query, [
      ...ss.map((s) => ({ item: { id: s.id, label: s.game, hint: `Season · ${s.years}`, href: href(s.id) }, text: `${s.game} ${s.years}` })),
      ...extras.map((e) => ({ item: { id: e.id, label: e.name.en, hint: `Event · ${seasonSearchLabel(ss, e.season)}`, href: href(e.season) }, text: `${e.name.en} ${e.name.ro}` })),
      ...aw.map((a) => ({ item: { id: a.id, label: a.name.en, hint: `Award · ${seasonSearchLabel(ss, a.season)}`, href: `/seasons/awards?award=${a.id}` }, text: `${a.name.en} ${a.name.ro} ${a.event.en}` })),
    ]);
  },
};
