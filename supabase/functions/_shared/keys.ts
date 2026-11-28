// Validation of CDN keys against CLAUDE.md §11, for objects the CMS uploads (it always adds a 6-character id).

/** Top-level folders of the §11 tree. Add new ones here and in CLAUDE.md §11 together. */
export const TOP_FOLDERS = ['brand', 'site', 'seasons', 'gallery', 'blog', 'sponsors', 'documents', 'press', 'projects', 'links', 'external'];

const MB = 1024 * 1024;
export const MAX_BYTES = { image: 15 * MB, pdf: 30 * MB, video: 100 * MB } as const;
export const MAX_KEY_LENGTH = 200;
export const MAX_SEGMENTS = 7;
export const VARIANT_MAX_WIDTH = 2560;

/** content type → [extension, size class] */
const TYPES: Record<string, { ext: string; cap: keyof typeof MAX_BYTES }> = {
  'image/webp': { ext: 'webp', cap: 'image' },
  'image/svg+xml': { ext: 'svg', cap: 'image' },
  'application/pdf': { ext: 'pdf', cap: 'pdf' },
  'video/mp4': { ext: 'mp4', cap: 'video' },
};

const DIR = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// {name}.{id}[-{width}][.poster].{ext}
const FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z0-9]{6})(?:-([1-9][0-9]{0,3}))?(\.poster)?\.([a-z0-9]+)$/;

export class KeyError extends Error {}

export interface ObjectSpec { key: string; contentType: string; size: number }

/** Throws KeyError with a message safe to show; returns the spec when it is acceptable. */
export function validateObject(o: unknown): ObjectSpec {
  if (!o || typeof o !== 'object') throw new KeyError('Each object needs a key, contentType and size.');
  const { key, contentType, size } = o as Record<string, unknown>;
  if (typeof key !== 'string' || typeof contentType !== 'string' || typeof size !== 'number') {
    throw new KeyError('Each object needs a key, contentType and size.');
  }
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) throw new KeyError(`“${key.slice(0, 40)}” isn’t a valid file path.`);
  const segs = key.split('/');
  if (segs.length < 2 || segs.length > MAX_SEGMENTS) throw new KeyError(`“${key}” isn’t in a library folder.`);
  const file = segs.pop()!;
  if (!TOP_FOLDERS.includes(segs[0])) throw new KeyError(`“${segs[0]}” isn’t a library folder.`);
  for (const d of segs) if (!DIR.test(d)) throw new KeyError(`Folder “${d}” must be lowercase letters, digits and hyphens.`);

  const t = TYPES[contentType];
  if (!t) throw new KeyError(`${contentType} files can’t be uploaded. Use WebP, SVG, PDF or MP4.`);
  const m = FILE.exec(file);
  if (!m) throw new KeyError(`“${file}” must look like name.abc123.${t.ext} (lowercase, no spaces or accents).`);
  const [, , , width, poster, ext] = m;
  if (ext !== t.ext) throw new KeyError(`“${file}” has the wrong extension for ${contentType}.`);
  if (width !== undefined) {
    if (ext !== 'webp' || poster) throw new KeyError(`“${file}” can’t have a width suffix.`);
    if (Number(width) > VARIANT_MAX_WIDTH) throw new KeyError(`“${file}” is wider than ${VARIANT_MAX_WIDTH} px.`);
  }
  if (poster && ext !== 'webp') throw new KeyError(`“${file}” can’t be a poster.`);

  if (!Number.isInteger(size) || size <= 0) throw new KeyError(`“${file}” has no size.`);
  const cap = MAX_BYTES[t.cap];
  if (size > cap) throw new KeyError(`“${file}” is over the ${cap / MB} MB limit for this type of file.`);
  return { key, contentType, size };
}

export type MediaRow = { key: string; kind: string; widths: number[] | null; poster: string | null };

const ROW_TYPE: Record<string, string> = { image: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', video: 'video/mp4' };
export const CONTENT_TYPE_BY_EXT: Record<string, string> = { webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', mp4: 'video/mp4' };

/** Every R2 object that belongs to a library record: the WebP variants, or the single object, plus a video poster. */
export function objectsOf(row: MediaRow): string[] {
  const keys = row.widths?.length ? row.widths.map((w) => `${row.key}-${w}.webp`) : [row.key];
  if (row.poster) keys.push(row.poster);
  return keys;
}

/**
 * The objects a library row may remove, or a KeyError. Rows are written by members, so nothing in them is trusted:
 * every derived key must pass the same validator as an upload, and a poster must be the video's own poster key.
 */
export function validatedObjectsOf(row: MediaRow): string[] {
  const type = ROW_TYPE[row.kind];
  if (!type) throw new KeyError('That file can’t be deleted here.');
  if (row.kind !== 'image' && row.widths?.length) throw new KeyError('That file can’t be deleted here.');
  if (row.poster && (row.kind !== 'video' || row.poster !== row.key.replace(/\.mp4$/, '.poster.webp'))) {
    throw new KeyError('That file can’t be deleted here.');
  }
  if (row.widths?.some((w) => !Number.isInteger(w))) throw new KeyError('That file can’t be deleted here.');
  const keys = objectsOf(row);
  for (const k of keys) {
    const isPoster = k === row.poster;
    validateObject({ key: k, contentType: isPoster ? 'image/webp' : type, size: 1 });
  }
  return keys;
}
