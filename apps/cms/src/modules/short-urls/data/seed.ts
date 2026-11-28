/** The six starting slugs of CLAUDE.md §3.12. Editors and dates are sample data. */
import { daysAgo } from '../../../lib/data/preview-kit';
import type { ShortUrl } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', vlad = 'vlad.stan@brickbot.ro';
const row = (slug: string, to: string, by: string, created: number, edited: number): ShortUrl => ({
  slug, to, createdBy: by, createdAt: daysAgo(created, 10), editedBy: by, editedAt: daysAgo(edited, 14),
});
export const shortUrls: ShortUrl[] = [
  row('apply', 'https://forms.gle/kr4LBrLzFzvTW4S18', matei, 120, 41),
  row('academy', 'https://forms.gle/16HcqxaW3yd2SXBd7', matei, 120, 120),
  row('submit-portfolio', 'https://forms.gle/YGcVdcwkANbtqKNs5', ana, 120, 90),
  row('formular230', 'https://formular230.ro/asociatia-brickbot', vlad, 120, 7),
  row('stripe', 'https://donate.stripe.com/00w6oI2wK5wBfQT0Sw5J602', ana, 60, 60),
  row('docs', 'https://docs.brickbot.ro', matei, 30, 30),
];
