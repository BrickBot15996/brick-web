import type { Edited } from '../../../lib/data';

/** brickbot.ro/<slug> → `to`. The slug is the id: one lowercase kebab-case segment. */
export interface ShortUrl extends Edited {
  slug: string;
  /** Full http(s) address. */
  to: string;
  createdBy: string;
  createdAt: string;
}
export type ShortUrlInput = Pick<ShortUrl, 'slug' | 'to'>;
