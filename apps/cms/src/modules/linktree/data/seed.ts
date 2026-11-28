/** The three legacy cards (docs/legacy-content/data/linktree-page.tsx, CLAUDE.md §4). Editors and dates of the edits are sample data. */
import { daysAgo } from '../../../lib/data/preview-kit';
import type { LinkCard } from './types';

const y = 2027;
export const cards: LinkCard[] = [
  { id: 'academy', title: 'Join our global mentorship program, BrickBot Academy!', display: 'brickbot.ro/academy', href: 'https://brickbot.ro/academy', icon: null, highlighted: true, start: '', end: '' },
  { id: 'donate', title: 'Support BrickBot through a secure online donation!', display: 'brickbot.ro/en/donate', href: 'https://brickbot.ro/en/donate', icon: null, highlighted: false, start: '', end: '' },
  // Visible until 24 May (the legacy cutoff, inclusive). It ended this year, so it shows as expired until the next edition is dated.
  { id: 'form-230', title: 'Redirect 3.5% of your income tax to help BrickBot!', display: 'brickbot.ro/formular230', href: 'https://brickbot.ro/formular230', icon: 'links/icons/form-230.svg', highlighted: false, start: `${y}-01-01`, end: `${y}-05-24` },
];
export const edit = { editedBy: 'ana.popescu@brickbot.ro', editedAt: daysAgo(6, 10) };
