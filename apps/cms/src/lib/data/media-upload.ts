import { useCallback, useRef, useState } from 'react';
import { videoPoster } from '../cdn';
import type { FileKind } from '../cdn';
import { slugify } from '../slug';
import { useContentMutation } from './hooks';
import { mediaApi, mediaKeys } from './media';
import type { MediaFile, PreparedUpload } from './media';

/**
 * The browser side of an upload (CLAUDE.md §11): name → kebab-case slug, a 6-character id, raster images resized into
 * WebP variants, SVG / PDF / MP4 kept as they are, a video poster taken from its first frame. Nothing here talks to
 * the network: the prepared objects go through `mediaApi.upload`.
 */

export const VARIANT_WIDTHS = [480, 960, 1600, 2560] as const;
export const MAX_LONG_EDGE = 2560;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const WEBP_QUALITY = 0.85;

/** A problem with the file itself; the message is safe to show. */
export class UploadError extends Error {}

/** Counts the frames of a GIF by walking its blocks; more than one means it is animated. */
export async function gifIsAnimated(file: Blob): Promise<boolean> {
  const b = new Uint8Array(await file.arrayBuffer());
  if (b.length < 14 || String.fromCharCode(...b.slice(0, 3)) !== 'GIF') return false;
  let i = 13;
  if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 7) + 1));
  const skipSub = () => { while (i < b.length && b[i] !== 0) i += b[i] + 1; i++; };
  let frames = 0;
  while (i < b.length) {
    const t = b[i++];
    if (t === 0x2c) {
      if (++frames > 1) return true;
      const flags = b[i + 8];
      i += 9;
      if (flags & 0x80) i += 3 * (1 << ((flags & 7) + 1));
      i++; // LZW minimum code size
      skipSub();
    } else if (t === 0x21) { i++; skipSub(); }
    else break; // 0x3b trailer or garbage
  }
  return false;
}

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function randomId(): string {
  const a = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(a, (n) => ID_CHARS[n % ID_CHARS.length]).join('');
}

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const RASTER_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'];

/** What an incoming file is, judged by extension and MIME type. */
export function sniffKind(file: File): FileKind {
  const ext = extOf(file.name);
  if (ext === 'svg' || file.type === 'image/svg+xml') return 'svg';
  if (RASTER_EXT.includes(ext) || /^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) return 'image';
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  if (['mp4', 'mov', 'webm', 'm4v'].includes(ext) || file.type.startsWith('video/')) return 'video';
  return 'other';
}

/** "Team Photo (final).JPG" becomes "team-photo-final". */
export function slugName(filename: string): string {
  const base = filename.replace(/\.[a-z0-9]+$/i, '');
  return slugify(base).slice(0, 60) || 'file';
}
export const folderPath = (folder: string) => (folder.replace(/^\/+|\/+$/g, '') ? `${folder.replace(/^\/+|\/+$/g, '')}/` : '');

const KIND_WORD: Record<string, string> = { image: 'an image', svg: 'an SVG', pdf: 'a PDF', video: 'a video' };
export const acceptedWords = (allow: FileKind[]) => allow.map((k) => KIND_WORD[k]).filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' or $1');

type Canvas = OffscreenCanvas | HTMLCanvasElement;
function makeCanvas(w: number, h: number): Canvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
async function toWebp(c: Canvas, quality = WEBP_QUALITY): Promise<Blob> {
  const blob = c instanceof HTMLCanvasElement
    ? await new Promise<Blob | null>((res) => c.toBlob(res, 'image/webp', quality))
    : await c.convertToBlob({ type: 'image/webp', quality });
  if (!blob || blob.type !== 'image/webp') throw new UploadError('This browser can’t make WebP images. Use a current Chrome, Firefox or Safari.');
  return blob;
}
function drawScaled(src: CanvasImageSource, w: number, h: number): Canvas {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new UploadError('This browser can’t resize images.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return c;
}

/**
 * Widths to generate: 480 / 960 / 1600 / 2560, only those no wider than the original (and whose long edge stays
 * within 2560). An original smaller than 480 px still gets one variant, at its own size, so there is something to serve.
 */
export function variantWidths(w: number, h: number): number[] {
  const fits = VARIANT_WIDTHS.filter((x) => x <= w && Math.round((x * Math.max(h, w)) / w) <= MAX_LONG_EDGE);
  if (fits.length) return fits;
  return [Math.max(1, Math.min(w, Math.floor((MAX_LONG_EDGE * w) / Math.max(h, w))))];
}

async function prepareRaster(file: File, folder: string, slug: string, id: string): Promise<PreparedUpload> {
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { throw new UploadError(`Couldn’t read ${file.name}. It may be damaged or in a format this browser can’t open.`); }
  const { width: W, height: H } = bmp;
  const base = `${folder}${slug}.${id}`;
  const widths = variantWidths(W, H);
  const objects = [];
  for (const w of widths) {
    const h = Math.max(1, Math.round((w * H) / W));
    objects.push({ key: `${base}-${w}.webp`, blob: await toWebp(drawScaled(bmp, w, h)), contentType: 'image/webp' });
  }
  bmp.close();
  return { kind: 'image', key: base, folder, objects, width: W, height: H, widths, size: objects.reduce((n, o) => n + o.blob.size, 0) };
}

async function prepareSvg(file: File, folder: string, slug: string, id: string): Promise<PreparedUpload> {
  const text = await file.text();
  if (!/<svg[\s>]/i.test(text)) throw new UploadError(`${file.name} doesn’t look like an SVG file.`);
  if (/<script[\s>]|\son[a-z]+\s*=/i.test(text)) throw new UploadError(`${file.name} contains scripts. Export a plain SVG without them.`);
  const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  const key = `${folder}${slug}.${id}.svg`;
  return {
    kind: 'svg', key, folder, size: file.size,
    ...(vb ? { width: Math.round(+vb[1]), height: Math.round(+vb[2]) } : {}),
    objects: [{ key, blob: file, contentType: 'image/svg+xml' }],
  };
}

async function preparePdf(file: File, folder: string, slug: string, id: string): Promise<PreparedUpload> {
  const head = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (head !== '%PDF-') throw new UploadError(`${file.name} isn’t a valid PDF.`);
  const key = `${folder}${slug}.${id}.pdf`;
  return { kind: 'pdf', key, folder, size: file.size, objects: [{ key, blob: file, contentType: 'application/pdf' }] };
}

const once = (el: HTMLElement, ev: string, ms: number) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), ms);
    el.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true });
    el.addEventListener('error', () => { clearTimeout(t); rej(new Error('error')); }, { once: true });
  });

/** The first frame of a video as a WebP, and the video's size. The poster is null when the browser can't decode the clip. */
export async function videoFirstFrame(file: Blob): Promise<{ poster: Blob | null; width?: number; height?: number }> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    await once(v, 'loadeddata', 8000);
    const t = Math.min(0.1, (v.duration || 0) / 2);
    if (t > 0) { v.currentTime = t; await once(v, 'seeked', 5000); }
    const w = v.videoWidth, h = v.videoHeight;
    if (!w || !h) return { poster: null };
    const pw = Math.min(w, 1280);
    const poster = await toWebp(drawScaled(v, pw, Math.round((pw * h) / w)));
    return { poster, width: w, height: h };
  } catch {
    return { poster: null };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareVideo(file: File, folder: string, slug: string, id: string): Promise<PreparedUpload> {
  if (extOf(file.name) !== 'mp4' && file.type !== 'video/mp4') throw new UploadError(`${file.name} isn’t an MP4. Convert it to MP4 (H.264, up to 1080p) first.`);
  if (file.size > MAX_VIDEO_BYTES) {
    throw new UploadError(`${file.name} is ${(file.size / 1024 ** 2).toFixed(0)} MB. Clips have to stay under 50 MB. Compress it, or put long videos on YouTube and add the link instead.`);
  }
  const key = `${folder}${slug}.${id}.mp4`;
  const { poster, width, height } = await videoFirstFrame(file);
  const posterKey = videoPoster(key);
  const objects = [{ key, blob: file as Blob, contentType: 'video/mp4' }];
  if (poster) objects.push({ key: posterKey, blob: poster, contentType: 'image/webp' });
  return { kind: 'video', key, folder, width, height, poster: poster ? posterKey : null, size: objects.reduce((n, o) => n + o.blob.size, 0), objects };
}

/** Validates and prepares one file for upload into `folder` ("gallery/decode/"). Rejects with UploadError for a bad file. */
export async function prepareUpload(file: File, folderIn: string, allow?: FileKind[]): Promise<PreparedUpload> {
  const kind = sniffKind(file);
  if (kind === 'other') throw new UploadError(`${file.name} isn’t a type the library takes. Use an image, SVG, PDF or MP4 video.`);
  if (allow && !allow.includes(kind)) throw new UploadError(`${file.name} can’t be used here. This field takes ${acceptedWords(allow)}.`);
  const folder = folderPath(folderIn);
  const slug = slugName(file.name);
  const id = randomId();
  if (kind === 'image' && (extOf(file.name) === 'gif' || file.type === 'image/gif') && await gifIsAnimated(file)) {
    throw new UploadError('Animated GIFs lose their motion. Upload the clip as an MP4 instead.');
  }
  if (kind === 'image') return prepareRaster(file, folder, slug, id);
  if (kind === 'svg') return prepareSvg(file, folder, slug, id);
  if (kind === 'pdf') return preparePdf(file, folder, slug, id);
  return prepareVideo(file, folder, slug, id);
}

// ───────── the queue hook the library, the picker and the gallery share ─────────

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  folder: string;
  status: 'queued' | 'preparing' | 'uploading' | 'done' | 'error';
  /** 0..1 while uploading. */
  progress: number;
  error?: string;
  /** False when the file itself is the problem (too big, wrong type): trying again can't help. */
  retriable?: boolean;
  result?: MediaFile;
}

let seq = 0;

/**
 * An upload queue: `add(files)` prepares (resize) and uploads each file, two at a time, and reports per-file status.
 * `folder` is the default target; a call may override it. `allow` rejects other kinds with a clear message.
 */
export function useUploader({ folder, allow, onDone }: { folder: string; allow?: FileKind[]; onDone?: (file: MediaFile, item: UploadItem) => void }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const files = useRef(new Map<string, File>());
  const cfg = useRef({ folder, allow, onDone });
  cfg.current = { folder, allow, onDone };
  const running = useRef(0);
  const waiting = useRef<(() => void)[]>([]);
  const send = useContentMutation((a: { p: PreparedUpload; on: (f: number) => void }) => mediaApi.upload(a.p, a.on), mediaKeys.all);
  const sendRef = useRef(send.mutateAsync);
  sendRef.current = send.mutateAsync;

  const patch = useCallback((id: string, p: Partial<UploadItem>) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...p } : i))), []);

  const run = useCallback(async (id: string, folderIn: string) => {
    const file = files.current.get(id)!;
    if (running.current >= 2) await new Promise<void>((r) => waiting.current.push(r));
    running.current++;
    try {
      patch(id, { status: 'preparing', progress: 0, error: undefined, retriable: undefined });
      const p = await prepareUpload(file, folderIn, cfg.current.allow);
      patch(id, { status: 'uploading', progress: 0 });
      const result = await sendRef.current({ p, on: (f) => patch(id, { progress: f }) });
      patch(id, { status: 'done', progress: 1, result });
      cfg.current.onDone?.(result, { id, name: file.name, size: file.size, folder: folderIn, status: 'done', progress: 1, result });
    } catch (e) {
      patch(id, { status: 'error', error: e instanceof Error && e.message ? e.message : 'Try again.', retriable: !(e instanceof UploadError) });
    } finally {
      running.current--;
      waiting.current.shift()?.();
    }
  }, [patch]);

  const add = useCallback((list: File[], to?: string) => {
    const target = to ?? cfg.current.folder;
    const fresh = list.map((f): UploadItem => ({ id: `u${++seq}`, name: f.name, size: f.size, folder: target, status: 'queued', progress: 0 }));
    fresh.forEach((it, i) => files.current.set(it.id, list[i]));
    setItems((cur) => [...fresh, ...cur]);
    fresh.forEach((it) => void run(it.id, target));
  }, [run]);

  const retry = useCallback((id: string) => { const it = items.find((i) => i.id === id); if (it) void run(id, it.folder); }, [items, run]);
  const dismiss = useCallback((id: string) => { files.current.delete(id); setItems((cur) => cur.filter((i) => i.id !== id)); }, []);
  const clearFinished = useCallback(() => setItems((cur) => cur.filter((i) => i.status !== 'done')), []);
  const busy = items.some((i) => i.status === 'queued' || i.status === 'preparing' || i.status === 'uploading');
  return { items, add, retry, dismiss, clearFinished, busy };
}
