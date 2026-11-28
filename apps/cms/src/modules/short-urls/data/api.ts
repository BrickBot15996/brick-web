import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveShortUrls } from './live';
import { previewShortUrls } from './preview';
import type { ShortUrl, ShortUrlInput } from './types';

/**
 * brickbot.ro/<slug> redirects. The website's build turns the list into its `_redirects` file, so edits go live on the
 * next Publish. The in-memory implementation is ./preview.ts; the Supabase one will be ./supabase.ts, passed as `live`.
 * A mutation that breaks a rule (duplicate or reserved slug) rejects with an Error whose message is safe to show.
 */
export interface ShortUrlsApi {
  list(): Promise<ShortUrl[]>;
  create(input: ShortUrlInput): Promise<ShortUrl>;
  /** `slug` is the current one; the input may rename it. */
  update(slug: string, input: ShortUrlInput): Promise<ShortUrl>;
  remove(slug: string): Promise<void>;
  /** Items for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const shortUrlsApi = defineApi<ShortUrlsApi>({ preview: previewShortUrls, live: liveShortUrls });
