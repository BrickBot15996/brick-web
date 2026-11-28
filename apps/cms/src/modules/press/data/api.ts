import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { livePress } from './live';
import { previewPress } from './preview';
import type { PressKit, PressKitInput } from './types';

/** Data contract of the Press kit. In-memory: ./preview.ts; Supabase's will be ./supabase.ts. */
export interface PressApi {
  get(): Promise<PressKit>;
  save(input: PressKitInput): Promise<PressKit>;
  /** Assets and descriptions for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const pressApi = defineApi<PressApi>({ preview: previewPress, live: livePress });
