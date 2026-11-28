/** Media on cdn.brickbot.ro (CLAUDE.md §11). While VITE_CDN_PREVIEW is on, files come from public/preview/<key>. */
const PREVIEW = import.meta.env.VITE_CDN_PREVIEW === 'true';
const BASE = import.meta.env.VITE_CDN_URL.replace(/\/$/, '');

export function cdn(key: string): string {
  const k = key.replace(/^\//, '');
  return PREVIEW ? `/preview/${k}` : `${BASE}/${k}`;
}

export type FileKind = 'image' | 'svg' | 'pdf' | 'video' | 'other';
/** What a CDN key is, from its extension (CLAUDE.md §11: photos .webp, logos .svg/.png, documents .pdf, video .mp4). */
export function fileKind(key: string): FileKind {
  const ext = key.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'svg') return 'svg';
  if (['webp', 'png', 'jpg', 'jpeg', 'gif', 'avif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  return 'other';
}
/** The poster next to a video: `{name}.mp4` has `{name}.poster.webp` (CLAUDE.md §11). */
export const videoPoster = (key: string) => key.replace(/\.[a-z0-9]+$/i, '.poster.webp');
