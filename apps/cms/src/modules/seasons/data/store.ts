import type { SeasonSummary } from '../../../lib/data/types';
import { seasonRecords } from './seed';
import type { SeasonRecord } from './types';

/**
 * The preview store of the season records: a leaf module (no module api, no hooks) so core's read-only season reference
 * (lib/data/preview.ts) can read it without an import cycle. The Seasons module is the source of truth for the list.
 */
export const seasonStore: { seasons: SeasonRecord[] } = { seasons: seasonRecords.map((s) => ({ ...s })) };

/** The shape of core's `useSeasons()`: newest first. */
export function seasonSummaries(): SeasonSummary[] {
  return [...seasonStore.seasons]
    .sort((a, b) => b.years.localeCompare(a.years))
    .map((s) => ({ id: s.id, game: s.game, years: s.years, current: s.current }));
}
