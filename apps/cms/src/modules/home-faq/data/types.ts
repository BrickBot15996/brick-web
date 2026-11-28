import type { Bilingual, Edited } from '../../../lib/data';

export type HeroMediaType = 'image' | 'video';
export interface Hero extends Edited {
  tagline: Bilingual;
  intro: Bilingual;
  mediaType: HeroMediaType;
  /** CDN key under site/home/ (.webp or .mp4), null until chosen. */
  media: string | null;
  /** Poster for a video (`{name}.poster.webp`), else null. */
  poster: string | null;
}
export type HeroInput = Omit<Hero, 'editedBy' | 'editedAt'>;

export interface Faq extends Edited {
  id: string;
  question: Bilingual;
  /** Markdown. */
  answer: Bilingual;
  /** Position, 0 first. */
  order: number;
}
export type FaqInput = Pick<Faq, 'question' | 'answer'>;

/** The Form 230 callout on the home page. Dates are "YYYY-MM-DD", both inclusive. */
export interface Form230 extends Edited {
  start: string;
  end: string;
  text: Bilingual;
  link: string;
}
export type Form230Input = Omit<Form230, 'editedBy' | 'editedAt'>;
