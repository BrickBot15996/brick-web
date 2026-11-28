/** The R2 free tier (CLAUDE.md §8). */
export const STORAGE_LIMIT_BYTES = 10 * 1024 ** 3;

/**
 * Stored WebP widths of CMS raster uploads (base key -> widths), filled by the live list and upload so `mediaUrl` can pick
 * a variant that exists. A key nobody has listed yet falls back to the 960 variant.
 */
const widthsByKey = new Map<string, number[]>();
export const rememberWidths = (key: string, widths: number[] | undefined) => { if (widths?.length) widthsByKey.set(key, [...widths].sort((a, b) => a - b)); };
export const widthsOf = (key: string) => widthsByKey.get(key);
