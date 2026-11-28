/** Media on cdn.brickbot.ro (CLAUDE.md §11). While VITE_CDN_PREVIEW is on, files come from public/preview/<key>. */
const PREVIEW = import.meta.env.VITE_CDN_PREVIEW === 'true';
const BASE = import.meta.env.VITE_CDN_URL.replace(/\/$/, '');

export function cdn(key: string): string {
  const k = key.replace(/^\//, '');
  return PREVIEW ? `/preview/${k}` : `${BASE}/${k}`;
}
