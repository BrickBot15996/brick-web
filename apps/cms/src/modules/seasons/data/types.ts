import type { Bilingual, Edited } from '../../../lib/data/types';

/** A season. Ids are the §11 slugs ("decode"). Media keys are CDN keys under `seasons/{id}/`. Matches the website's `Season`. */
export interface SeasonRecord extends Edited {
  id: string;
  /** Game name as FIRST writes it: "DECODE", "INTO THE DEEP". */
  game: string;
  /** "2025–26". */
  years: string;
  /** FTC Events season code (the start year). Null: no FTC Events data (seasons before 2020). */
  ftc: number | null;
  current: boolean;
  gameLogo: string | null;
  teamPhoto: string | null;
  robot: string | null;
  /** Public Onshape document of the robot's CAD; '' when none. */
  onshape: string;
  portfolioPdf: string | null;
  portfolioCover: string | null;
}
/** What the season editor saves. `current` has its own action (setCurrent). */
export type SeasonInput = Omit<SeasonRecord, 'id' | 'current' | 'editedBy' | 'editedAt'>;

export type Alliance = 'winner' | 'finalist' | 'division-winner' | 'division-finalist' | null;

/** An official event the team played, imported from FTC Events at build time. Read-only here. */
export interface ImportedEvent {
  code: string;
  season: string;
  name: string;
  /** ISO dates. */
  start: string;
  end: string;
  place: string;
  /** Qualification rank (for a league meet this is the league's running standing). */
  rank: number | null;
  /** The team played at least one qualification match. */
  played: boolean;
  alliance: Alliance;
  /** The event on ftc-events.firstinspires.org. */
  url: string;
}

/** A custom result an editor set on an imported event. It replaces the imported one on the website. */
export interface EventOverride extends Edited {
  season: string;
  code: string;
  rank: number | null;
  /** Free result text ("Semifinalist"). Empty pair: show the custom rank only. */
  result: Bilingual;
  note: string;
}
export type OverrideInput = { rank: number | null; result: Bilingual; note: string };

/** An event that is not on FTC Events (offseason cup, unofficial format). Website: `Season.extraEvents`. */
export interface ExtraEvent extends Edited {
  id: string;
  season: string;
  name: Bilingual;
  /** `YYYY-MM-DD`, `YYYY-MM` or `YYYY` when the exact day is not on record. */
  date: string;
  place: Bilingual;
  /** Link for the location (text + hyperlink, no map); '' when none. */
  placeUrl: string;
  result: Bilingual;
}
export type ExtraEventInput = Omit<ExtraEvent, 'id' | 'season' | 'editedBy' | 'editedAt'>;

export interface SeasonEvents { imported: ImportedEvent[]; overrides: EventOverride[]; extras: ExtraEvent[] }

/** Award categories the CMS offers (optional on an award). */
export const AWARD_TYPES = ['Inspire', 'Think', 'Connect', 'Innovate', 'Control', 'Motivate', 'Design', 'Promote', 'Compass', 'Judges’ Choice', 'Dean’s List', 'Winning alliance', 'Finalist alliance', 'Placement'] as const;

/** Awards are always managed here (they need translations). Website: `Award`, `at` is `eventCode`. */
export interface Award extends Edited {
  id: string;
  season: string;
  name: Bilingual;
  /** The event's name as the website prints it. */
  event: Bilingual;
  /** Set when won at an imported event. */
  eventCode: string | null;
  /** Set when won at an extra event. */
  extraId: string | null;
  type: string | null;
}
export type AwardInput = Omit<Award, 'id' | 'editedBy' | 'editedAt'>;
