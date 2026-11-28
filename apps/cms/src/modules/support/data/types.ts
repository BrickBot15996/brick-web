import type { Bilingual, Edited } from '../../../lib/data';

export interface Tier { id: string; name: string; /** EUR */ amount: number }
export interface Sponsor extends Edited {
  id: string;
  name: string;
  /** CDN key, e.g. sponsors/banca-transilvania.webp */
  logo: string | null;
  /** Empty when the sponsor has no site. */
  website: string;
  /** Season id (see SeasonSummary). */
  season: string;
  /** Tier id. Internal only; never shown on the public site. */
  tier: string;
}
export type SponsorInput = Omit<Sponsor, 'id' | 'editedBy' | 'editedAt'>;

// ───────── Tiers tab ─────────
/**
 * A sponsorship tier as the Partner with Us page shows it (name in both languages, "from" amount in EUR, and how many of
 * the ordered benefits it includes). Tiers are listed lowest first; the order of the list is the order on the page.
 */
export interface TierDef { id: string; name: Bilingual; /** EUR */ amount: number; /** The first N benefits are included (cumulative). */ benefits: number }
export interface Benefit { text: Bilingual }
export interface TierPlan extends Edited { tiers: TierDef[]; benefits: Benefit[] }
export type TierPlanInput = Omit<TierPlan, keyof Edited>;

// ───────── Documents tab ─────────
/** A sponsor deck of one season, e.g. documents/sponsor-deck-2026-27.pdf. */
export interface SponsorDeck { season: string; file: string | null }
export interface SupportDocs extends Edited {
  decks: SponsorDeck[];
  /** documents/sample-contract.pdf */
  contract: string | null;
  /** "How sponsorship contracts work", Markdown. */
  contractText: Bilingual;
}
export type SupportDocsInput = Omit<SupportDocs, keyof Edited>;

// ───────── Budget tab ─────────
export interface BudgetCategory { id: string; name: Bilingual; /** EUR spent */ amount: number }
/** The spending of one season, in EUR. `remaining` is the money left at the end. */
export interface SeasonBudget extends Edited { season: string; categories: BudgetCategory[]; remaining: number }
export type SeasonBudgetInput = Omit<SeasonBudget, 'season' | keyof Edited>;
