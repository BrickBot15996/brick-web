import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveHomeFaq } from './live';
import { previewHomeFaq } from './preview';
import type { Faq, FaqInput, Form230, Form230Input, Hero, HeroInput } from './types';

/** Data contract of Home & FAQ. In-memory: ./preview.ts; Supabase's will be ./supabase.ts. */
export interface HomeFaqApi {
  getHero(): Promise<Hero>;
  saveHero(input: HeroInput): Promise<Hero>;
  listFaq(): Promise<Faq[]>;
  createFaq(input: FaqInput): Promise<Faq>;
  updateFaq(id: string, input: FaqInput): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;
  reorderFaq(ids: string[]): Promise<void>;
  getForm230(): Promise<Form230>;
  saveForm230(input: Form230Input): Promise<Form230>;
  /** FAQ questions for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const homeFaqApi = defineApi<HomeFaqApi>({ preview: previewHomeFaq, live: liveHomeFaq });
