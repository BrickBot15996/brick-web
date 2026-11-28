import { useQuery } from '@tanstack/react-query';
import { useContentMutation } from '../../../lib/data/hooks';
import { settingsApi } from './api';
import type { Network, SiteSettingsInput } from './types';

export const settingsKeys = { all: ['settings'] as const };

/** The site settings record. The Linktree module reads the socials from here. */
export function useSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: () => settingsApi.get() });
}
export function useSaveSettings() {
  return useContentMutation((input: SiteSettingsInput) => settingsApi.save(input), settingsKeys.all);
}
/** Reorders the social icons; used by the Linktree module. */
export function useReorderSocials() {
  return useContentMutation((order: Network[]) => settingsApi.reorderSocials(order), settingsKeys.all);
}
