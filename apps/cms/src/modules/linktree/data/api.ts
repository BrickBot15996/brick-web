import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveLinktree } from './live';
import { previewLinktree } from './preview';
import type { Linktree, LinktreeInput } from './types';

/**
 * The link cards of links.brickbot.ro. The social icons live in Site settings (settings/data); the Linktree screen
 * reorders them through that module's own hooks, so this interface holds the cards only.
 * The in-memory implementation is ./preview.ts; the Supabase one will be ./supabase.ts, passed as `live`.
 */
export interface LinktreeApi {
  get(): Promise<Linktree>;
  save(input: LinktreeInput): Promise<Linktree>;
  /** Items for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const linktreeApi = defineApi<LinktreeApi>({ preview: previewLinktree, live: liveLinktree });
