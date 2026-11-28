import { formatDate } from '../../lib/dates';
import type { Alliance, Award, EventOverride, ExtraEvent, ImportedEvent, SeasonEvents } from './data/types';

export const ALLIANCE: Record<Exclude<Alliance, null>, string> = {
  winner: 'Winner', finalist: 'Finalist', 'division-winner': 'Division winner', 'division-finalist': 'Division finalist',
};

/** "Rank 4 · Finalist" from what FTC Events reports. '' when it reports nothing. */
export function importedResult(e: Pick<ImportedEvent, 'rank' | 'alliance'>): string {
  return [e.rank != null ? `Rank ${e.rank}` : '', e.alliance ? ALLIANCE[e.alliance] : ''].filter(Boolean).join(' · ');
}

/** "14 Mar 2026", "Aug 2025" or "2023": extra events may carry a partial date. */
export function showDate(d: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return formatDate(d);
  const m = /^(\d{4})-(\d{2})$/.exec(d);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short', year: 'numeric' });
  return d;
}
export const isValidEventDate = (d: string) => /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/.test(d.trim());
/** Sorting key: a partial date sorts at its start. */
const startOf = (d: string) => (d.length === 4 ? `${d}-01-01` : d.length === 7 ? `${d}-01` : d);
/** The last day a partial date can mean, to tell whether the event is still ahead. */
const endOf = (d: string) => (d.length === 4 ? `${d}-12-31` : d.length === 7 ? `${d}-31` : d);

export const todayStr = () => new Date().toISOString().slice(0, 10);

export interface EventRow {
  key: string;
  kind: 'imported' | 'extra';
  /** Date as written (`YYYY-MM-DD`, or partial for an extra event). */
  date: string;
  sortKey: string;
  name: string;
  place: string;
  placeUrl: string | null;
  /** The result as the website shows it; '' when there is none. */
  result: string;
  /** For an overridden event: what FTC Events says. */
  original: string | null;
  override: EventOverride | null;
  upcoming: boolean;
  hidden: boolean;
  awards: number;
  imported?: ImportedEvent;
  extra?: ExtraEvent;
}

/** Why the website leaves a past imported event out. */
export const HIDDEN_WHY = 'Hidden on the website: it is past, FTC Events has no ranking and no matches for the team, and no award of ours was won there.';

/** The one events table: imported, overridden and extra events, merged by date. */
export function buildRows(ev: SeasonEvents, awards: Award[], today = todayStr()): EventRow[] {
  const rows: EventRow[] = [];
  for (const e of ev.imported) {
    const override = ev.overrides.find((o) => o.code === e.code) ?? null;
    const count = awards.filter((a) => a.eventCode === e.code && a.season === e.season).length;
    const orig = importedResult(e);
    const upcoming = e.end >= today;
    const custom = override ? [override.rank != null ? `Rank ${override.rank}` : '', override.result.en.trim()].filter(Boolean).join(' · ') : '';
    rows.push({
      key: `i:${e.code}`, kind: 'imported', date: e.start, sortKey: e.start, name: e.name, place: e.place, placeUrl: null,
      result: override ? custom || orig : orig, original: override ? orig || 'No result' : null, override,
      upcoming, hidden: !upcoming && !override && e.rank == null && !e.played && count === 0, awards: count, imported: e,
    });
  }
  for (const x of ev.extras) {
    rows.push({
      key: `x:${x.id}`, kind: 'extra', date: x.date, sortKey: startOf(x.date), name: x.name.en, place: x.place.en, placeUrl: x.placeUrl || null,
      result: x.result.en, original: null, override: null, upcoming: endOf(x.date) >= today && x.result.en.trim() === '', hidden: false,
      awards: awards.filter((a) => a.extraId === x.id).length, extra: x,
    });
  }
  return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.name.localeCompare(b.name));
}

/** The next event still ahead (the earliest upcoming row), for the current season. */
export const nextEvent = (rows: EventRow[]) => rows.find((r) => r.upcoming && !r.hidden) ?? null;
