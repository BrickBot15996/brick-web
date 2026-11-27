/**
 * Seasons (CLAUDE.md §3.5). Manual data, later managed in the CMS "Seasons" module:
 * game name and years, FTCScout season code, media keys, and awards (always manual, they need translations).
 * Media keys point at cdn.brickbot.ro (§11); a missing key means the file isn't uploaded yet and the UI omits it.
 */
import type { Locale } from './site';

/** `at` is the FTCScout event code the award was won at, so it shows in that event's result. Seasons before 2020 have no events table: their awards are listed on their own. */
export interface Award { event: Record<Locale, string>; award: Record<Locale, string>; at?: string }
/**
 * An event that isn't on FTCScout (offseason cups, unofficial formats) but has a result worth showing.
 * Merged into the events table by date. `date` may be `YYYY-MM-DD`, `YYYY-MM` or `YYYY` when the exact day isn't on record.
 * Models the CMS Seasons module's "custom events".
 */
export interface ExtraEvent { name: Record<Locale, string>; date: string; place: Record<Locale, string>; result: Record<Locale, string> }
export interface Season {
  slug: string;
  name: string;
  years: string;          // "2025⁠–⁠26"
  start: number;          // first calendar year
  ftc?: number;           // FTCScout season number (= start year); data exists from 2020
  current?: boolean;
  teamPhoto?: { key: string; width: number; height: number };
  /** Robot photo. `placeholder` draws it as a logo on an LED board instead of a full-bleed photo. */
  robot?: { key: string; width: number; height: number; placeholder?: boolean };
  onshape?: string;       // public Onshape document of the robot's CAD
  /** Engineering portfolio: the PDF and an optional cover image (CDN keys, or full URLs for files still on legacy paths). */
  portfolio?: { pdf: string; cover?: { key: string; width: number; height: number } };
  awards: Award[];
  extraEvents?: ExtraEvent[];
}

const a = (enE: string, enA: string, roE: string, roA: string, at?: string): Award => ({ event: { en: enE, ro: roE }, award: { en: enA, ro: roA }, at });

export const seasons: Season[] = [
  {
    slug: 'biobuzz', name: 'BioBuzz', years: '2026⁠–⁠27', start: 2026, ftc: 2026, current: true,
    teamPhoto: { key: 'seasons/biobuzz/team-photo.webp', width: 1600, height: 1066 },
    awards: [],
  },
  {
    slug: 'decode', name: 'DECODE', years: '2025⁠–⁠26', start: 2025, ftc: 2025,
    teamPhoto: { key: 'seasons/decode/team-photo.webp', width: 960, height: 640 },
    // Still on the legacy bucket path; re-upload as seasons/decode/portfolio.pdf (+ portfolio-cover.webp) and switch to the keys.
    portfolio: {
      pdf: 'https://cdn.brickbot.ro/projects/the-vault/portfolios/brickbot-decode.pdf',
      cover: { key: 'https://cdn.brickbot.ro/projects/the-vault/thumbnails/brickbot-decode.webp', width: 3508, height: 2480 },
    },
    awards: [
      a('FIRST Championship', 'Division finalist alliance', 'Campionatul Mondial FIRST', 'Alianța finalistă a diviziei', 'FTCCMP1GOOD'),
      a('FIRST Championship', 'Design Award, 2nd place', 'Campionatul Mondial FIRST', 'Design Award, locul 2', 'FTCCMP1GOOD'),
      a('Romania National Championship', 'Finalist alliance', 'Campionatul Național al României', 'Alianța finalistă', 'ROCMP'),
      a('East League Tournament', 'Think Award, 2nd place', 'Turneul Ligii Est', 'Think Award, locul 2', 'ROELT'),
      a('Bucharest Twin Cup', 'Finalist alliance', 'Bucharest Twin Cup', 'Alianța finalistă', 'ROBUOS1'),
    ],
  },
  {
    slug: 'into-the-deep', name: 'Into the Deep', years: '2024⁠–⁠25', start: 2024, ftc: 2024,
    extraEvents: [{ name: { en: 'SparkHope Robotics Cup', ro: 'SparkHope Robotics Cup' }, date: '2025-08', place: { en: 'Romania', ro: 'România' }, result: { en: 'Winning alliance', ro: 'Alianța câștigătoare' } }],
    awards: [
      a('Italy Championship', 'Innovate Award, 2nd place', 'Campionatul Italiei', 'Innovate Award, locul 2', 'ITCMP'),
      a('Romania East Championship', 'Motivate Award, 2nd place', 'Regionala Est', 'Motivate Award, locul 2', 'ROELT'),
    ],
  },
  {
    slug: 'centerstage', name: 'CENTERSTAGE', years: '2023⁠–⁠24', start: 2023, ftc: 2023,
    awards: [
      a('Bucharest Twin Cup', '8th place', 'Bucharest Twin Cup', 'Locul 8', 'ROBUOS'),
      a('Romania East Championship', 'Think Award, 3rd place', 'Regionala Est', 'Think Award, locul 3', 'RONR4LT'),
    ],
  },
  {
    slug: 'powerplay', name: 'POWERPLAY', years: '2022⁠–⁠23', start: 2022, ftc: 2022,
    extraEvents: [{ name: { en: 'Quantum League', ro: 'Quantum League' }, date: '2023', place: { en: 'Romania', ro: 'România' }, result: { en: 'Winners', ro: 'Câștigători' } }],
    awards: [
      a('Dean’s List', 'Finalist', 'Dean’s List', 'Finalist', 'ROCMP1'),
      a('Qualifying Tournament', 'Innovate Award winners', 'Turneu de calificare', 'Câștigători Innovate Award', 'ROBUQ1'),
    ],
  },
  {
    slug: 'freight-frenzy', name: 'Freight Frenzy', years: '2021⁠–⁠22', start: 2021, ftc: 2021,
    awards: [a('Romania Regional #3', 'Design Award winners', 'Regionala #3', 'Câștigători Design Award', 'ROBUQ3')],
  },
  {
    slug: 'ultimate-goal', name: 'Ultimate Goal', years: '2020⁠–⁠21', start: 2020, ftc: 2020,
    awards: [
      a('Romania National Championship', 'Innovate Award, 2nd place', 'Campionatul Național', 'Innovate Award, locul 2', 'ROBUOS1'),
      a('Romania Qualifying Tournament #3', 'Inspire Award winners', 'Turneu de calificare #3', 'Câștigători Inspire Award', 'ROABBUQT3'),
    ],
  },
  {
    slug: 'skystone', name: 'SKYSTONE', years: '2019⁠–⁠20', start: 2019,
    awards: [a('Romania Moldova Regional', 'Think Award, 2nd place', 'Regionala Moldova', 'Think Award, locul 2')],
  },
  {
    slug: 'rover-ruckus', name: 'Rover Ruckus', years: '2018⁠–⁠19', start: 2018,
    awards: [
      a('Dean’s List', 'Finalist', 'Dean’s List', 'Finalist'),
      a('Romania National Championship', 'Finalists', 'Campionatul Național', 'Finaliști'),
      a('Romania Moldova Regional', 'Control Award winners', 'Regionala Moldova', 'Câștigători Control Award'),
      a('Romania Moldova Regional', 'Winners', 'Regionala Moldova', 'Câștigători'),
    ],
  },
  { slug: 'relic-recovery', name: 'Relic Recovery', years: '2017⁠–⁠18', start: 2017, awards: [] },
  { slug: 'velocity-vortex', name: 'Velocity Vortex', years: '2016⁠–⁠17', start: 2016, awards: [] },
];

export const currentSeason = seasons.find((s) => s.current) ?? seasons[0];
export const seasonBySlug = (slug: string) => seasons.find((s) => s.slug === slug);
export const totalAwards = seasons.reduce((n, s) => n + s.awards.length + (s.extraEvents?.length ?? 0), 0);
