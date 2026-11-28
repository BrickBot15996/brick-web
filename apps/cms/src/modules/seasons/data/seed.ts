/**
 * Seasons seed. Records, awards and the two extra events mirror apps/website/src/lib/seasons.ts (itself from
 * docs/legacy-content). SAMPLE DATA: every imported FTC Events event, the one override, and the editors and dates;
 * the real events come from the FTC Events API at build time.
 */
import { daysAgo } from '../../../lib/data/preview-kit';
import type { Award, EventOverride, ExtraEvent, ImportedEvent, SeasonRecord } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro';

type S = [id: string, game: string, years: string, ftc: number | null, extra?: Partial<SeasonRecord>];
const rows: S[] = [
  ['biobuzz', 'BioBuzz', '2026–27', 2026, { current: true, teamPhoto: 'seasons/biobuzz/team-photo.webp' }],
  ['decode', 'DECODE', '2025–26', 2025, { teamPhoto: 'seasons/decode/team-photo.webp', portfolioPdf: 'seasons/decode/portfolio.pdf', portfolioCover: 'seasons/decode/portfolio-cover.webp', robot: 'seasons/decode/robot.webp', onshape: 'https://cad.onshape.com/documents/sample-decode-robot' }],
  ['into-the-deep', 'INTO THE DEEP', '2024–25', 2024, {}],
  ['centerstage', 'CENTERSTAGE', '2023–24', 2023, {}],
  ['powerplay', 'POWERPLAY', '2022–23', 2022, {}],
  ['freight-frenzy', 'FREIGHT FRENZY', '2021–22', 2021, {}],
  ['ultimate-goal', 'ULTIMATE GOAL', '2020–21', 2020, {}],
  ['skystone', 'SKYSTONE', '2019–20', null, {}],
  ['rover-ruckus', 'ROVER RUCKUS', '2018–19', null, {}],
  ['relic-recovery', 'RELIC RECOVERY', '2017–18', null, {}],
  ['velocity-vortex', 'VELOCITY VORTEX', '2016–17', null, {}],
];

export const seasonRecords: SeasonRecord[] = rows.map(([id, game, years, ftc, extra], i) => ({
  id, game, years, ftc, current: false, gameLogo: null, teamPhoto: null, robot: null, onshape: '', portfolioPdf: null, portfolioCover: null,
  ...extra,
  editedBy: i % 2 ? ana : matei, editedAt: daysAgo(3 + i * 5),
}));

// ───────── imported events (SAMPLE) ─────────
const ev = (season: string, ftc: number, code: string, name: string, start: string, place: string, rank: number | null, played: boolean, alliance: ImportedEvent['alliance'] = null, end = start): ImportedEvent =>
  ({ code, season, name, start, end, place, rank, played, alliance, url: `https://ftc-events.firstinspires.org/${ftc}/${code}` });

export const importedEvents: ImportedEvent[] = [
  ev('biobuzz', 2026, 'ROELM1', 'Focșani Tech Challenge', '2027-01-23', 'Focșani, Romania', null, false),
  ev('biobuzz', 2026, 'ROELM2', 'Romania East League Meet 2', '2027-02-20', 'Bârlad, Romania', null, false),
  ev('decode', 2025, 'ROELM1', 'Romania East League Meet 1', '2025-11-08', 'Focșani, Romania', 5, true),
  ev('decode', 2025, 'ROELM2', 'Romania East League Meet 2', '2025-12-06', 'Bârlad, Romania', 2, true),
  ev('decode', 2025, 'ROXPD', 'Cluj Practice Day', '2026-01-17', 'Cluj-Napoca, Romania', null, false),
  ev('decode', 2025, 'ROELT', 'Romania East League Tournament', '2026-02-14', 'Iași, Romania', 4, true),
  ev('decode', 2025, 'ROBUOS1', 'Bucharest Twin Cup', '2026-03-07', 'Bucharest, Romania', 6, true, 'finalist'),
  ev('decode', 2025, 'ROCMP', 'Romania National Championship', '2026-03-28', 'Brașov, Romania', 5, true, 'finalist'),
  ev('decode', 2025, 'FTCCMP1GOOD', 'FIRST Championship – Good Division', '2026-04-15', 'Houston, TX, USA', 20, true, 'division-finalist', '2026-04-18'),
  ev('into-the-deep', 2024, 'ROELM1', 'Romania East League Meet 1', '2024-11-16', 'Focșani, Romania', 3, true),
  ev('into-the-deep', 2024, 'ROELT', 'Romania East Championship', '2025-02-22', 'Iași, Romania', 3, true),
  ev('into-the-deep', 2024, 'ROXQT', 'Qualifier (registered, did not play)', '2025-01-18', 'Pitești, Romania', null, false),
  ev('into-the-deep', 2024, 'ITCMP', 'Italy Championship', '2025-03-15', 'Rome, Italy', 9, true),
];

/** SAMPLE: a custom result on a league meet. FTC Events only shows the league's running standing, so the meet's own rank is entered by hand. */
export const eventOverrides: EventOverride[] = [
  { season: 'decode', code: 'ROELM1', rank: 2, result: { en: '', ro: '' }, note: 'FTC Events shows the league standing (5th). This is our rank at the meet itself, from FTCScout.', editedBy: ana, editedAt: daysAgo(9) },
];

// ───────── extra events (from the website) ─────────
export const extraEvents: ExtraEvent[] = [
  { id: 'sparkhope-2025', season: 'into-the-deep', name: { en: 'SparkHope Robotics Cup', ro: 'SparkHope Robotics Cup' }, date: '2025-08', place: { en: 'Romania', ro: 'România' }, placeUrl: '', result: { en: 'Winning alliance', ro: 'Alianța câștigătoare' }, editedBy: matei, editedAt: daysAgo(40) },
  { id: 'quantum-league-2023', season: 'powerplay', name: { en: 'Quantum League', ro: 'Quantum League' }, date: '2023', place: { en: 'Romania', ro: 'România' }, placeUrl: '', result: { en: 'Winners', ro: 'Câștigători' }, editedBy: ana, editedAt: daysAgo(52) },
];

// ───────── awards (apps/website/src/lib/seasons.ts) ─────────
type A = [season: string, enE: string, enA: string, roE: string, roA: string, code?: string];
const aw: A[] = [
  ['decode', 'FIRST Championship', 'Division finalist alliance', 'Campionatul Mondial FIRST', 'Alianța finalistă a diviziei', 'FTCCMP1GOOD'],
  ['decode', 'FIRST Championship', 'Design Award, 2nd place', 'Campionatul Mondial FIRST', 'Design Award, locul 2', 'FTCCMP1GOOD'],
  ['decode', 'Romania National Championship', 'Finalist alliance', 'Campionatul Național al României', 'Alianța finalistă', 'ROCMP'],
  ['decode', 'East League Tournament', 'Think Award, 2nd place', 'Turneul Ligii Est', 'Think Award, locul 2', 'ROELT'],
  ['decode', 'Bucharest Twin Cup', 'Finalist alliance', 'Bucharest Twin Cup', 'Alianța finalistă', 'ROBUOS1'],
  ['into-the-deep', 'Italy Championship', 'Innovate Award, 2nd place', 'Campionatul Italiei', 'Innovate Award, locul 2', 'ITCMP'],
  ['into-the-deep', 'Romania East Championship', 'Motivate Award, 2nd place', 'Regionala Est', 'Motivate Award, locul 2', 'ROELT'],
  ['centerstage', 'Bucharest Twin Cup', '8th place', 'Bucharest Twin Cup', 'Locul 8'],
  ['centerstage', 'Romania East Championship', 'Think Award, 3rd place', 'Regionala Est', 'Think Award, locul 3'],
  ['powerplay', 'Dean’s List', 'Finalist', 'Dean’s List', 'Finalist'],
  ['powerplay', 'Qualifying Tournament', 'Innovate Award winners', 'Turneu de calificare', 'Câștigători Innovate Award'],
  ['freight-frenzy', 'Romania Regional #3', 'Design Award winners', 'Regionala #3', 'Câștigători Design Award'],
  ['ultimate-goal', 'Romania National Championship', 'Innovate Award, 2nd place', 'Campionatul Național', 'Innovate Award, locul 2'],
  ['ultimate-goal', 'Romania Qualifying Tournament #3', 'Inspire Award winners', 'Turneu de calificare #3', 'Câștigători Inspire Award'],
  ['skystone', 'Romania Moldova Regional', 'Think Award, 2nd place', 'Regionala Moldova', 'Think Award, locul 2'],
  ['rover-ruckus', 'Dean’s List', 'Finalist', 'Dean’s List', 'Finalist'],
  ['rover-ruckus', 'Romania National Championship', 'Finalists', 'Campionatul Național', 'Finaliști'],
  ['rover-ruckus', 'Romania Moldova Regional', 'Control Award winners', 'Regionala Moldova', 'Câștigători Control Award'],
  ['rover-ruckus', 'Romania Moldova Regional', 'Winners', 'Regionala Moldova', 'Câștigători'],
];

function typeOf(en: string, event: string): string | null {
  if (/^Dean/.test(event)) return 'Dean’s List';
  const named = /(Inspire|Think|Connect|Innovate|Control|Motivate|Design|Promote|Compass)/.exec(en);
  if (named) return named[1];
  if (/finalist/i.test(en)) return 'Finalist alliance';
  if (/winner/i.test(en)) return 'Winning alliance';
  if (/place/i.test(en)) return 'Placement';
  return null;
}

const linkable = new Set(importedEvents.map((e) => `${e.season}:${e.code}`));
const count: Record<string, number> = {};
export const awards: Award[] = aw.map(([season, enE, enA, roE, roA, code], i) => {
  count[season] = (count[season] ?? 0) + 1;
  return {
    id: `${season}-${count[season]}`, season,
    name: { en: enA, ro: roA }, event: { en: enE, ro: roE },
    eventCode: code && linkable.has(`${season}:${code}`) ? code : null, extraId: null, type: typeOf(enA, enE),
    editedBy: i % 3 ? ana : matei, editedAt: daysAgo(6 + i),
  };
});
