/**
 * Media URLs on cdn.brickbot.ro (CLAUDE.md §11).
 *
 * `key` is the object key, e.g. "seasons/decode/team-photo.webp" (a hand-uploaded file) or
 * "seasons/decode/team-photo.k3f9a2" (a CMS upload, base key without width or extension).
 * While CDN_PREVIEW is on, files come from public/preview/<key>, the local copies waiting in
 * docs/cdn-manifest.md for upload.
 */
const PREVIEW = import.meta.env.PUBLIC_CDN_PREVIEW === 'true';
const BASE = String(import.meta.env.PUBLIC_CDN_URL).replace(/\/$/, '');

export function cdn(key: string): string {
  if (/^https?:\/\//.test(key)) return key; // already a full URL (a file still on a legacy path)
  const k = key.replace(/^\//, '');
  return PREVIEW ? `/preview/${k}` : `${BASE}/${k}`;
}

/** CMS raster uploads: `{base}-{width}.webp` for each generated width. */
export function cdnSrcset(baseKey: string, widths: number[]): string {
  return widths.map((w) => `${cdn(`${baseKey}-${w}.webp`)} ${w}w`).join(', ');
}
