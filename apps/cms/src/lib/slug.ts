/** "Focșani Tech Challenge" becomes "focsani-tech-challenge": lowercase, ASCII, kebab-case (CLAUDE.md §11). */
export function slugify(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export const isSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
