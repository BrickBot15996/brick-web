import type { Bilingual, Edited } from '../../../lib/data';

/** Logo and wordmark files, CDN keys under brand/. "dark"/"light" is the background the file is made for. */
export interface PressMarks {
  logoSvgDark: string | null;
  logoSvgLight: string | null;
  logoPngDark: string | null;
  logoPngLight: string | null;
  wordmarkSvgDark: string | null;
  wordmarkSvgLight: string | null;
  wordmarkPngDark: string | null;
  wordmarkPngLight: string | null;
}
export type PressPhotoKind = 'team' | 'robot';
export interface PressPhoto { id: string; kind: PressPhotoKind; /** CDN key under press/photos/ */ file: string; alt: Bilingual }

export interface PressKit extends Edited {
  marks: PressMarks;
  photos: PressPhoto[];
  shortDescription: Bilingual;
  longDescription: Bilingual;
  /** Defaults to contact@brickbot.ro. */
  contactEmail: string;
}
export type PressKitInput = Omit<PressKit, 'editedBy' | 'editedAt'>;
