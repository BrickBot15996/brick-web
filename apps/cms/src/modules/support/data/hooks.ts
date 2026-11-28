import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { supportApi } from './api';
import type { SeasonBudgetInput, SponsorInput, SupportDocsInput, TierPlanInput } from './types';

/** This module's query keys, so its mutations know what to refresh. */
export const supportKeys = {
  all: ['support'] as const,
  sponsors: ['support', 'sponsors'] as const,
  tiers: ['support', 'tiers'] as const,
  tierPlan: ['support', 'tier-plan'] as const,
  docs: ['support', 'docs'] as const,
  budget: (season: string) => ['support', 'budget', season] as const,
};

export function useSponsors() {
  return useQuery({ queryKey: supportKeys.sponsors, queryFn: () => supportApi.listSponsors() });
}
export function useTiers() {
  return useQuery({ queryKey: supportKeys.tiers, queryFn: () => supportApi.listTiers(), staleTime: 5 * 60_000 });
}
export function useTierPlan() {
  return useQuery({ queryKey: supportKeys.tierPlan, queryFn: () => supportApi.getTierPlan() });
}
export function useSupportDocs() {
  return useQuery({ queryKey: supportKeys.docs, queryFn: () => supportApi.getDocs() });
}
export function useBudget(season: string) {
  return useQuery({ queryKey: supportKeys.budget(season), queryFn: () => supportApi.getBudget(season) });
}

export function useCreateSponsor() {
  return useContentMutation((input: SponsorInput) => supportApi.createSponsor(input), supportKeys.sponsors);
}
export function useUpdateSponsor() {
  return useContentMutation((a: { id: string; input: SponsorInput }) => supportApi.updateSponsor(a.id, a.input), supportKeys.sponsors);
}
export function useDeleteSponsor() {
  return useContentMutation((id: string) => supportApi.deleteSponsor(id), supportKeys.sponsors);
}
// Sponsors show tier names and the editor offers the tier list, so the whole module is refreshed.
export function useSaveTierPlan() {
  return useContentMutation((input: TierPlanInput) => supportApi.saveTierPlan(input), supportKeys.all);
}
export function useSaveDocs() {
  return useContentMutation((input: SupportDocsInput) => supportApi.saveDocs(input), supportKeys.docs);
}
export function useSaveBudget() {
  return useContentMutation((a: { season: string; input: SeasonBudgetInput }) => supportApi.saveBudget(a.season, a.input), supportKeys.all);
}
