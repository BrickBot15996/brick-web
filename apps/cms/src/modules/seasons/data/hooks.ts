import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { seasonsApi } from './api';
import type { AwardInput, ExtraEventInput, OverrideInput, SeasonInput } from './types';

/**
 * Query keys. Core's season reference list lives at ['seasons'], so every key here nests under it: invalidating
 * `seasonKeys.all` also refreshes the pickers in other modules (the current season, a game name).
 */
export const seasonKeys = {
  all: ['seasons'] as const,
  list: ['seasons', 'records'] as const,
  events: (season: string) => ['seasons', 'events', season] as const,
  awards: ['seasons', 'awards'] as const,
};

export function useSeasonRecords() {
  return useQuery({ queryKey: seasonKeys.list, queryFn: () => seasonsApi.list() });
}
export function useSeasonEvents(season: string, enabled = true) {
  return useQuery({ queryKey: seasonKeys.events(season), queryFn: () => seasonsApi.events(season), enabled });
}
export function useAwards() {
  return useQuery({ queryKey: seasonKeys.awards, queryFn: () => seasonsApi.awards() });
}

export function useUpdateSeason() {
  return useContentMutation((a: { id: string; input: SeasonInput }) => seasonsApi.update(a.id, a.input), seasonKeys.all);
}
export function useSetCurrentSeason() {
  return useContentMutation((id: string) => seasonsApi.setCurrent(id), seasonKeys.all);
}
export function useSetOverride() {
  return useContentMutation((a: { season: string; code: string; input: OverrideInput }) => seasonsApi.setOverride(a.season, a.code, a.input), seasonKeys.all);
}
export function useClearOverride() {
  return useContentMutation((a: { season: string; code: string }) => seasonsApi.clearOverride(a.season, a.code), seasonKeys.all);
}
export function useSaveExtra() {
  return useContentMutation((a: { season: string; id: string | null; input: ExtraEventInput }) => seasonsApi.saveExtra(a.season, a.id, a.input), seasonKeys.all);
}
export function useRemoveExtra() {
  return useContentMutation((id: string) => seasonsApi.removeExtra(id), seasonKeys.all);
}
export function useSaveAward() {
  return useContentMutation((a: { id: string | null; input: AwardInput }) => seasonsApi.saveAward(a.id, a.input), seasonKeys.all);
}
export function useRemoveAward() {
  return useContentMutation((id: string) => seasonsApi.removeAward(id), seasonKeys.all);
}
