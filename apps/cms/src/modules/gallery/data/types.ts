import type { Bilingual, Edited } from '../../../lib/data';

export type GalleryKind = 'photo' | 'video' | 'youtube';

/**
 * Mirrors GalleryItem in apps/website/src/lib/gallery.ts (key, width, height, season, date, featured, alt, caption), plus
 * what the CMS adds: the kind, a YouTube id, and who edited. `season` null means "general" (gallery/general/).
 */
export interface GalleryItem extends Edited {
  id: string;
  kind: GalleryKind;
  /** CDN key of the photo or the MP4 (a video's poster sits next to it). Null for a YouTube embed. */
  key: string | null;
  /** The 11-character video id of a YouTube embed. Null otherwise. */
  youtubeId: string | null;
  /** Pixel size (a YouTube embed is 1280×720). */
  width: number;
  height: number;
  /** Season slug, or null for general. */
  season: string | null;
  /** YYYY-MM-DD, or null. The website shows month and year. */
  date: string | null;
  featured: boolean;
  /** What a screen reader says. Optional; the website falls back to the caption. */
  alt: Bilingual;
  caption: Bilingual;
}
/** What an editor saves; the data layer fills in id and who edited. */
export type GalleryInput = Omit<GalleryItem, 'id' | 'editedBy' | 'editedAt'>;

export interface GalleryBulkPatch { season?: string | null; featured?: boolean }
