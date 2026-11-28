import type { Bilingual, Edited } from '../../../lib/data';

/** The networks of the social icons (CLAUDE.md §4). One entry per network; list order is icon order. */
export type Network = 'website' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'email' | 'youtube' | 'github';
export interface SocialLink { network: Network; /** https://… , or mailto:… for email. */ url: string }

export interface Association {
  name: string;
  /** Romanian fiscal code, digits only. */
  cif: string;
  bank: string;
  branch: Bilingual;
  /** Without spaces. */
  iban: string;
}

/**
 * Site-wide facts shared by the website (footer, contact page, Donate) and the links page (socials). One record.
 * There is no phone number, on purpose (CLAUDE.md §3.9).
 */
export interface SiteSettings extends Edited {
  /** The only public email address. */
  email: string;
  address: Bilingual;
  /** Google Maps embed (iframe src) of the Business Profile. Empty falls back to an address search. */
  mapsEmbed: string;
  /** "Open in Google Maps". */
  mapsLink: string;
  association: Association;
  socials: SocialLink[];
}
export type SiteSettingsInput = Omit<SiteSettings, keyof Edited>;
