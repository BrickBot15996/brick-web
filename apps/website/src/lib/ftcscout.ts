/**
 * Official events and results from the FTCScout public API, read at build time (CLAUDE.md §3.5).
 * Responses are cached on disk for a day so dev reloads don't hammer the API; any failure returns [] and the
 * page falls back to the manual data. No match lists or scores are shown, only rank and alliance result.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.ftcscout.org/rest/v1';
const TEAM = 15996;
const CACHE = join(process.cwd(), 'node_modules', '.cache', 'ftcscout');
const DAY = 24 * 60 * 60 * 1000;

async function get<T>(path: string): Promise<T | null> {
  const file = join(CACHE, path.replace(/[^a-z0-9]+/gi, '_') + '.json');
  try {
    if (existsSync(file) && Date.now() - statSync(file).mtimeMs < DAY) return JSON.parse(readFileSync(file, 'utf8'));
  } catch { /* stale or unreadable cache: refetch */ }
  try {
    const res = await fetch(API + path, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, JSON.stringify(data));
    return data;
  } catch {
    return null;
  }
}

interface TeamEvent { eventCode: string; stats: { rank?: number; qualMatchesPlayed?: number } | null }
interface EventInfo {
  code: string; divisionCode: string | null; name: string; start: string; end: string; type: string; remote: boolean;
  venue: string | null; city: string | null; state: string | null; country: string | null; website: string | null;
}
interface TeamAward { eventCode: string; type: string; placement: number }

export interface ScoutEvent {
  code: string;
  name: string;
  start: string;           // ISO date
  end: string;
  place: string;           // "Houston, TX, USA"
  venue: string | null;
  remote: boolean;
  rank: number | null;     // qualification rank
  played: boolean;         // the team played at least one qualification match (false: registered but never ranked)
  alliance: 'winner' | 'finalist' | 'division-winner' | 'division-finalist' | null;
  url: string;             // the event on ftcscout.org
}

/** At a division event (it has a parent), the event's own Winner/Finalist awards are division results. */
const allianceOf = (types: Set<string>, isDivision: boolean): ScoutEvent['alliance'] =>
  types.has('Winner') ? (isDivision ? 'division-winner' : 'winner')
  : types.has('Finalist') ? (isDivision ? 'division-finalist' : 'finalist')
  : types.has('DivisionWinner') ? 'division-winner' : types.has('DivisionFinalist') ? 'division-finalist' : null;

/** FTCScout shows names and places as event organisers typed them: tidy them for a sponsor-facing page. */
const NAME_FIX: Record<string, string> = { 'Meet TehnoZ (principle name TBA)': 'Meet TehnoZ' };
/** Romanian place names inside event names get the same diacritics as places. */
const fixName = (n: string) => Object.entries({ Braila: 'Brăila', Focsani: 'Focșani', Timisoara: 'Timișoara', Pitesti: 'Pitești', Barlad: 'Bârlad', Botosani: 'Botoșani', Buzau: 'Buzău' })
  .reduce((acc, [a, b]) => acc.replace(new RegExp(`\\b${a}\\b`, 'g'), b), NAME_FIX[n] ?? n);
const CITY_FIX: Record<string, string> = {
  'Piatra - Neamț': 'Piatra Neamț', 'Piatra Neamt': 'Piatra Neamț', 'Piatra Neamţ': 'Piatra Neamț', 'Piatra-Neamț': 'Piatra Neamț',
  Focsani: 'Focșani', Timisoara: 'Timișoara', Pitesti: 'Pitești', Braila: 'Brăila', Barlad: 'Bârlad', Botosani: 'Botoșani', Buzau: 'Buzău', Campina: 'Câmpina', Bucuresti: 'Bucharest',
};
const place = (city: string | null, state: string | null, country: string | null) => {
  const c = city ? (CITY_FIX[city.trim()] ?? city.trim()) : null;
  // Romanian county codes (VN, NT…) mean nothing to most readers; US states stay (Houston, TX).
  return [c, country === 'Romania' ? null : state, country].filter(Boolean).join(', ');
};

const memo = new Map<number, Promise<ScoutEvent[]>>();

/** Every official event the team played (or is registered for) in one FTCScout season, oldest first. */
export function teamEvents(season: number): Promise<ScoutEvent[]> {
  if (!memo.has(season)) memo.set(season, load(season));
  return memo.get(season)!;
}

async function load(season: number): Promise<ScoutEvent[]> {
  const [events, awards] = await Promise.all([
    get<TeamEvent[]>(`/teams/${TEAM}/events/${season}`),
    get<(TeamAward & { season: number })[]>(`/teams/${TEAM}/awards?season=${season}`),
  ]);
  if (!events) return [];
  const byEvent = new Map<string, Set<string>>();
  for (const aw of awards ?? []) {
    if (!byEvent.has(aw.eventCode)) byEvent.set(aw.eventCode, new Set());
    byEvent.get(aw.eventCode)!.add(aw.type);
  }
  const out: (ScoutEvent & { parent: string | null })[] = [];
  for (const ev of events) {
    const info = await get<EventInfo>(`/events/${season}/${ev.eventCode}`);
    if (!info) continue;
    out.push({
      code: info.code,
      name: fixName(info.name).replace(/\s+-\s+/g, ' – '),
      start: info.start,
      end: info.end,
      place: place(info.city, info.state, info.country),
      venue: info.venue ? info.venue.trim().replace(/[,\s]+$/, '') : null,
      remote: info.remote,
      rank: ev.stats?.rank ?? null,
      played: (ev.stats?.qualMatchesPlayed ?? 0) > 0,
      alliance: allianceOf(byEvent.get(ev.eventCode) ?? new Set(), !!info.divisionCode),
      url: `https://ftcscout.org/events/${season}/${info.code}`,
      parent: info.divisionCode,
    });
  }
  // A championship appears twice: the umbrella event and the division the team played in. Show one row:
  // the umbrella with the division's rank when the umbrella holds the alliance result, else the division.
  const drop = new Set<string>();
  for (const div of out.filter((e) => e.parent)) {
    const parent = out.find((e) => e.code === div.parent);
    if (!parent) continue;
    if (parent.alliance) { parent.rank ??= div.rank; parent.played ||= div.played; drop.add(div.code); } else drop.add(parent.code);
  }
  return out
    .filter((e) => !drop.has(e.code))
    .map(({ parent: _p, ...e }) => e)
    .sort((x, y) => x.start.localeCompare(y.start));
}
