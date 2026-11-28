import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveSettings } from './live';
import { previewSettings } from './preview';
import type { Network, SiteSettings, SiteSettingsInput } from './types';

/**
 * Site settings: one record. The Linktree module reads it too (the socials are shared) and reorders the icons through
 * `reorderSocials`. The in-memory implementation is ./preview.ts; the Supabase one will be ./supabase.ts, passed as `live`.
 */
export interface SettingsApi {
  get(): Promise<SiteSettings>;
  save(input: SiteSettingsInput): Promise<SiteSettings>;
  /** Puts the socials in this order (networks not listed keep their place at the end). */
  reorderSocials(order: Network[]): Promise<SiteSettings>;
  /** Items for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const settingsApi = defineApi<SettingsApi>({ preview: previewSettings, live: liveSettings });
