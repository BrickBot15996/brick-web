import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveSupport } from './live';
import { previewSupport } from './preview';
import type { Sponsor, SponsorInput, SeasonBudget, SeasonBudgetInput, SupportDocs, SupportDocsInput, Tier, TierPlan, TierPlanInput } from './types';

/**
 * The contract of this module's data: sponsors, the tier plan, the documents and the per-season budget.
 * The in-memory implementation is ./preview.ts; the Supabase one will be ./supabase.ts, passed as `live`.
 */
export interface SupportApi {
  listSponsors(): Promise<Sponsor[]>;
  createSponsor(input: SponsorInput): Promise<Sponsor>;
  updateSponsor(id: string, input: SponsorInput): Promise<Sponsor>;
  deleteSponsor(id: string): Promise<void>;
  /** The tiers a sponsor can have (English names), lowest first. A view over the tier plan. */
  listTiers(): Promise<Tier[]>;
  getTierPlan(): Promise<TierPlan>;
  /** Rejects when a removed tier still has sponsors. */
  saveTierPlan(input: TierPlanInput): Promise<TierPlan>;
  getDocs(): Promise<SupportDocs>;
  saveDocs(input: SupportDocsInput): Promise<SupportDocs>;
  /** Null when nothing was saved for that season yet. */
  getBudget(season: string): Promise<SeasonBudget | null>;
  saveBudget(season: string, input: SeasonBudgetInput): Promise<SeasonBudget>;
  /** Items for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

export const supportApi = defineApi<SupportApi>({ preview: previewSupport, live: liveSupport });
