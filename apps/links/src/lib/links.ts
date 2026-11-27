/**
 * Linktree content (CLAUDE.md §4). Manual for now; the CMS "Linktree" module (`cms.links`) replaces it.
 * Cards with `start` / `end` are filtered at build time and again in the browser (src/scripts/links.ts),
 * so a link disappears on its end date even before the next rebuild.
 */
export interface LinkCard {
  title: string;
  /** Shown under or beside the title for ordinary links, e.g. "brickbot.ro/apply". */
  display?: string;
  href: string;
  /** Pinned links: photo-backed, shown first. `image` is a CDN key (CLAUDE.md §11). */
  highlighted?: boolean;
  image?: string;
  imagePosition?: string;
  /** One short line under a pinned title. */
  note?: string;
  /** ISO dates, inclusive. */
  start?: string;
  end?: string;
  /** Label for the status chip while the link is live; `{end}` is replaced with the end date. */
  chip?: string;
}

const year = new Date().getFullYear();

export const links: LinkCard[] = [
  {
    title: 'Redirect 3.5% of your income tax',
    href: 'https://brickbot.ro/formular230',
    highlighted: true,
    image: 'seasons/decode/team-photo.webp',
    note: 'Form 230 costs you nothing.',
    start: `${year}-01-01`, end: `${year}-05-25`, chip: 'Until {end}',
  },
  {
    title: 'Join BrickBot Academy',
    href: 'https://brickbot.ro/academy',
    highlighted: true,
    image: 'site/home/schools-classroom.webp',
    imagePosition: '50% 35%',
    note: 'Our global mentorship program.',
  },
  { title: 'Donate securely', display: 'brickbot.ro/donate', href: 'https://brickbot.ro/en/donate' },
  { title: 'Apply to join the team', display: 'brickbot.ro/apply', href: 'https://brickbot.ro/apply' },
];

/** The logo and wordmark link here. */
export const siteUrl = 'https://brickbot.ro/en';

/** Same source of truth as the website footer (shared through the database later). */
export const socials = [
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/brickbotcnu' },
  { id: 'facebook', label: 'Facebook', href: 'https://facebook.com/brickbotcnu' },
  { id: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@brickbotcnu' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/brickbot' },
  { id: 'youtube', label: 'YouTube', href: 'https://youtube.com/channel/UCRpA5UNXSZDl2GmPt_E91ew' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/BrickBot15996' },
  { id: 'email', label: 'Email', href: 'mailto:contact@brickbot.ro' },
];

/** Live today? Dates are inclusive and compared as calendar days. */
export function isLive(l: Pick<LinkCard, 'start' | 'end'>, now = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  return (!l.start || day >= l.start) && (!l.end || day <= l.end);
}

export function endLabel(end: string): string {
  return new Date(end + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}
