import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveSeasons } from './live';
import { previewSeasons } from './preview';
import type { Award, AwardInput, ExtraEvent, ExtraEventInput, OverrideInput, SeasonEvents, SeasonInput, SeasonRecord } from './types';

/**
 * The contract of this module's data. Preview: ./preview.ts. A rule-breaking mutation rejects with an Error whose
 * message is safe to show. Every mutation calls `logActivity`.
 */
export interface SeasonsApi {
  /** Seasons, newest first. */
  list(): Promise<SeasonRecord[]>;
  update(id: string, input: SeasonInput): Promise<SeasonRecord>;
  /** Makes this the one current season (the previous one stops being current). */
  setCurrent(id: string): Promise<void>;
  /** Imported (FTC Events, read-only), overrides and extra events of one season. */
  events(season: string): Promise<SeasonEvents>;
  setOverride(season: string, code: string, input: OverrideInput): Promise<void>;
  clearOverride(season: string, code: string): Promise<void>;
  /** `id` null creates. */
  saveExtra(season: string, id: string | null, input: ExtraEventInput): Promise<ExtraEvent>;
  removeExtra(id: string): Promise<void>;
  /** Every award of every season. */
  awards(): Promise<Award[]>;
  saveAward(id: string | null, input: AwardInput): Promise<Award>;
  removeAward(id: string): Promise<void>;
  /** Seasons, events and awards for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const seasonsApi = defineApi<SeasonsApi>({ preview: previewSeasons, live: liveSeasons });
