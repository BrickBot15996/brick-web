import { isSlug } from '../../lib/slug';

/**
 * Slugs a short URL must not take, with the reason shown to the editor. The website's pages live under /en and /ro,
 * but a few top-level names are also taken: the language prefixes, the old URLs that redirect (CLAUDE.md §3.12) and
 * files the build produces. The page names come from the sitemap in CLAUDE.md §3.
 */
const PAGES: [name: string, en: string, ro: string][] = [
  ['Our Story', 'about', 'despre'],
  ['The Team', 'team', 'echipa'],
  ['Gallery', 'gallery', 'galerie'],
  ['Seasons', 'seasons', 'sezoane'],
  ['Projects', 'projects', 'proiecte'],
  ['BrickLog', 'blog', 'blog'],
  ['Join', 'join', 'alatura-te'],
  ['Partner with Us', 'partners', 'parteneri'],
  ['Donate', 'donate', 'doneaza'],
  ['Our Sponsors', 'sponsors', 'sponsori'],
  ['Press Kit', 'press', 'presa'],
  ['Contact', 'contact', 'contact'],
  ['Terms', 'terms', 'termeni-si-conditii'],
  ['Privacy', 'privacy', 'politica-de-confidentialitate'],
];

const map = new Map<string, string>();
map.set('en', '“en” is the English version of the website (/en).');
map.set('ro', '“ro” is the Romanian version of the website (/ro).');
for (const [name, en, ro] of PAGES) {
  if (!map.has(en)) map.set(en, `“${en}” is the ${name} page in English (/en/${en}). Pick another word.`);
  if (!map.has(ro)) map.set(ro, `“${ro}” is the ${name} page in Romanian (/ro/${ro}). Pick another word.`);
}
// Legacy redirects at the top level (§3.12): they stay in force.
map.set('donate', '“donate” is an old address that redirects to /en/donate, and it must keep doing that.');
map.set('doneaza', '“doneaza” is an old address that redirects to /ro/doneaza, and it must keep doing that.');
map.set('projects', '“projects” is the start of old project addresses that redirect to /en/projects/, and they must keep doing that.');
for (const t of ['sitemap', 'sitemap-index', 'robots', '404', 'preview']) map.set(t, `“${t}” is a file or folder the website itself uses.`);

/** Why `slug` cannot be used, or null when it is free of collisions. */
export function reservedReason(slug: string): string | null {
  return map.get(slug.trim().toLowerCase()) ?? null;
}

/** Why a slug is malformed, or null. */
export function slugShapeError(slug: string): string | null {
  const s = slug.trim();
  if (!s) return 'Enter the word people will type after brickbot.ro/.';
  if (s.length > 60) return 'Keep it under 60 characters.';
  if (!isSlug(s)) return 'Use lowercase letters, digits and single hyphens only, like submit-portfolio. No spaces, accents or slashes.';
  return null;
}

/** Why a destination cannot be used, or null. `slug` lets it catch a link that points to itself. */
export function destinationError(to: string, slug: string): string | null {
  const v = to.trim();
  if (!v) return 'Enter where it should go.';
  let u: URL;
  try { u = new URL(v); } catch { return 'Enter a full address that starts with https://.'; }
  if (!['http:', 'https:'].includes(u.protocol)) return 'Enter a full address that starts with https://.';
  if (/(^|\.)brickbot\.ro$/.test(u.hostname) && u.hostname.replace(/^www\./, '') === 'brickbot.ro' && u.pathname.replace(/\/$/, '') === `/${slug.trim()}`) return 'This points back to itself.';
  return null;
}
