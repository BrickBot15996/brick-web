import { useQuery } from '@tanstack/react-query';
import { cdn, fileKind, videoPoster } from '../cdn';
import type { FileKind } from '../cdn';
import { logActivity } from './activity';
import { liveMedia } from './media-live';
import { STORAGE_LIMIT_BYTES, widthsOf } from './media-shared';
import { defineApi } from './module';
import { addPreviewMedia, nowIso, PREVIEW_ME, previewDelay, previewFailSave, previewMediaKeys } from './preview-kit';
import { rankSearch } from './search';
import type { SearchItem } from './search';

/**
 * The shared media layer: what the pickers (components/edit/MediaPicker, FileField), the Media library module and the
 * Gallery use. Owned by the Media library module. Everything the other modules already import from here
 * (`MediaFile.key/kind`, `mediaApi.list`, `useMediaFiles`) keeps its meaning.
 *
 * Keys follow CLAUDE.md §11. A raster image uploaded through the CMS is stored as WebP variants
 * `{name}.{id}-{width}.webp`; the record's `key` is the base `{name}.{id}` and `widths` lists the variants.
 * Everything else is one object `{name}.{id}.{ext}` (a video also has `{name}.{id}.poster.webp`).
 */

export { STORAGE_LIMIT_BYTES };

export interface MediaFile {
  /** The CDN key. For CMS uploads of raster images, the base key (no width suffix, see CLAUDE.md §11). */
  key: string;
  kind: FileKind;
  /** Bytes of every stored object of this file (all variants and the poster). Undefined when unknown. */
  size?: number;
  /** Original dimensions (images, SVG viewBox, video). */
  width?: number;
  height?: number;
  /** Stored WebP variant widths of a CMS raster upload. Absent for hand-uploaded and single-object files. */
  widths?: number[];
  /** Video poster key. */
  poster?: string | null;
  /** Email of the member who uploaded it, for CMS uploads. */
  uploadedBy?: string;
  uploadedAt?: string;
}

/** One object ready to be PUT to R2. */
export interface PreparedObject { key: string; blob: Blob; contentType: string }
/** The result of the in-browser preparation (resize / poster), before anything is sent. */
export interface PreparedUpload {
  kind: FileKind;
  /** The record key: the base key for rasters, the object key otherwise. */
  key: string;
  folder: string;
  objects: PreparedObject[];
  width?: number;
  height?: number;
  widths?: number[];
  poster?: string | null;
  /** Total bytes of all objects. */
  size: number;
}
/** Something that uses a file, shown in the delete warning. */
export interface MediaUsage { label: string; hint: string; href: string }
export type UsageProvider = (key: string) => MediaUsage[] | Promise<MediaUsage[]>;

export interface MediaApi {
  /** Files under any of the prefixes ("sponsors/", "brand/"), optionally only of the given kinds. Newest uploads first. */
  list(opts: { prefixes: string[]; kinds?: FileKind[] }): Promise<MediaFile[]>;
  /**
   * Sends the prepared objects to R2 and records the file. The live implementation asks the `media` Edge Function for
   * presigned URLs, PUTs each object, then inserts the row (see media-live.ts, including the orphan note). `onProgress` gets 0..1.
   */
  upload(prepared: PreparedUpload, onProgress: (fraction: number) => void): Promise<MediaFile>;
  /** Deletes every object of the file (variants and poster too). */
  remove(key: string): Promise<void>;
  /** Content that uses the file. Empty when nothing is known to. */
  usage(key: string): Promise<MediaUsage[]>;
  storage(): Promise<{ usedBytes: number; limitBytes: number }>;
  /** Files for the jump palette (≤ 5). */
  search(query: string): Promise<SearchItem[]>;
}

// ───────── helpers shared by the UI ─────────

const KNOWN_EXT = /\.(svg|webp|png|jpe?g|gif|avif|pdf|mp4|webm|mov|zip|ico)$/i;
/** A CMS raster upload's base key: ends in a 6-character id, not a file extension. */
export const isVariantBase = (key: string) => !KNOWN_EXT.test(key) && /\.[a-z0-9]{6}$/.test(key);
/** `fileKind` that also understands base keys of CMS raster uploads. */
export const mediaKind = (key: string): FileKind => (isVariantBase(key) ? 'image' : fileKind(key));
export const fileLeaf = (key: string) => key.split('/').pop() ?? key;
/** "seasons/decode/" for "seasons/decode/team-photo.webp"; "" at the root. */
export const folderOf = (key: string) => (key.includes('/') ? key.slice(0, key.lastIndexOf('/') + 1) : '');

export function formatBytes(n: number | undefined): string {
  if (n === undefined) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(n < 10 * 1024 ** 2 ? 1 : 0)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

// Object URLs of files uploaded in preview (key -> blob URL), so they display without a server.
const blobUrls = new Map<string, string>();
const previewUploads: MediaFile[] = [];

/**
 * A displayable URL for a key: the in-memory copy of a preview upload, else the CDN. For a CMS raster base key it picks
 * the smallest stored variant that is at least `want` px wide (default 960); with no record it assumes the 960 variant.
 */
export function mediaUrl(key: string, want = 960): string {
  const own = blobUrls.get(key);
  if (own) return own;
  if (isVariantBase(key)) {
    const widths = previewUploads.find((u) => u.key === key)?.widths ?? widthsOf(key) ?? [960];
    const w = widths.find((x) => x >= want) ?? widths[widths.length - 1];
    const vk = `${key}-${w}.webp`;
    return blobUrls.get(vk) ?? cdn(vk);
  }
  return cdn(key);
}

// ───────── preview implementation ─────────

/** Sizes and dimensions of the hand-uploaded files in public/preview, registered by the Media library module. */
const fileInfo = new Map<string, { size: number; width?: number; height?: number }>();
export function addPreviewFileInfo(rows: [key: string, size: number, width: number, height: number][]): void {
  addPreviewMedia(rows.map((r) => r[0]));
  for (const [key, size, width, height] of rows) fileInfo.set(key, { size, ...(width ? { width, height } : {}) });
}

// A few sample non-image files so the pickers can be tried in preview.
addPreviewMedia(['documents/sponsor-deck-2025-26.pdf', 'documents/sample-contract.pdf', 'gallery/decode/pit-crew.mp4']);
fileInfo.set('documents/sponsor-deck-2025-26.pdf', { size: 4_820_000 });
fileInfo.set('documents/sample-contract.pdf', { size: 212_000 });
fileInfo.set('gallery/decode/pit-crew.mp4', { size: 18_400_000, width: 1920, height: 1080 });

/** Sample figure: the old bucket's content already counted against the 10 GB, so the meter has something to show. */
const PREVIEW_BASELINE_BYTES = 3.1 * 1024 ** 3;
const removed = new Set<string>();
const usageProviders: UsageProvider[] = [];
/** A module whose content refers to files registers a lookup here so the delete warning can name it. */
export function registerMediaUsage(provider: UsageProvider): void {
  usageProviders.push(provider);
}

function allPreviewFiles(): MediaFile[] {
  const own = new Set(previewUploads.map((u) => u.key));
  const hand = previewMediaKeys()
    .filter((k) => !removed.has(k) && !own.has(k))
    .sort()
    .map((key): MediaFile => ({ key, kind: fileKind(key), ...fileInfo.get(key) }));
  return [...previewUploads.filter((u) => !removed.has(u.key)), ...hand];
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const previewMedia: MediaApi = {
  async list({ prefixes, kinds }) {
    await previewDelay();
    return allPreviewFiles()
      .filter((f) => prefixes.some((p) => f.key.startsWith(p)))
      .filter((f) => !kinds || kinds.includes(f.kind));
  },
  async upload(p, onProgress) {
    previewFailSave();
    // Simulated transfer, so the progress UI shows: about 0.5–1.4 s.
    const steps = 10;
    const per = 50 + Math.min(90, p.size / 60_000);
    for (let i = 1; i <= steps; i++) { await sleep(per); onProgress(i / steps); }
    for (const o of p.objects) blobUrls.set(o.key, URL.createObjectURL(o.blob));
    const file: MediaFile = {
      key: p.key, kind: p.kind, size: p.size, width: p.width, height: p.height, widths: p.widths,
      poster: p.poster ?? null, uploadedBy: PREVIEW_ME, uploadedAt: nowIso(),
    };
    previewUploads.unshift(file);
    logActivity({ action: 'uploaded', targetLabel: fileLeaf(p.key), detail: `to ${p.folder || 'the root'}`, module: 'Media library', href: `/media?file=${encodeURIComponent(p.key)}` });
    return file;
  },
  async remove(key) {
    await previewDelay();
    previewFailSave();
    const f = allPreviewFiles().find((x) => x.key === key);
    if (!f) return;
    const objs = [...blobUrls.keys()].filter((k) => k === key || k.startsWith(`${key}-`) || (f.kind === 'video' && k === videoPoster(key)));
    for (const k of objs) { URL.revokeObjectURL(blobUrls.get(k)!); blobUrls.delete(k); }
    const i = previewUploads.findIndex((u) => u.key === key);
    if (i >= 0) previewUploads.splice(i, 1);
    removed.add(key);
    logActivity({ action: 'deleted file', targetLabel: fileLeaf(key), module: 'Media library', href: '/media' });
  },
  async usage(key) {
    await previewDelay(80);
    return (await Promise.all(usageProviders.map((p) => p(key)))).flat();
  },
  async storage() {
    await previewDelay(80);
    const sum = allPreviewFiles().reduce((n, f) => n + (f.size ?? 0), 0);
    return { usedBytes: Math.round(PREVIEW_BASELINE_BYTES + sum), limitBytes: STORAGE_LIMIT_BYTES };
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, allPreviewFiles().map((f) => ({
      item: { id: f.key, label: fileLeaf(f.key), hint: `File · ${folderOf(f.key) || 'root'}`, href: `/media?file=${encodeURIComponent(f.key)}` },
      text: f.key,
    })));
  },
};
export const mediaApi = defineApi<MediaApi>({ preview: previewMedia, live: liveMedia });

export const mediaKeys = { all: ['media'] as const };

export function useMediaFiles(prefixes: string[], kinds?: FileKind[], enabled = true) {
  return useQuery({
    queryKey: ['media', prefixes.join(','), (kinds ?? []).join(',')],
    queryFn: () => mediaApi.list({ prefixes, kinds }),
    enabled,
    staleTime: 60_000,
  });
}
