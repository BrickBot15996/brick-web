// Media library backend (docs/backend.md §6, §9): presigned uploads to R2 and deletes that also remove the row.
import { handle, HttpError, bad } from '../_shared/http.ts';
import { guard } from '../_shared/guard.ts';
import { validateObject, KeyError, type ObjectSpec } from '../_shared/keys.ts';
import { validatedObjectsOf, type MediaRow } from '../_shared/keys.ts';
import { deleteObject, presign, r2Config } from '../_shared/r2.ts';

const MAX_OBJECTS = 12; // 4 widths and a poster fit comfortably
const EXPIRES = 600;
const SVG_DISPOSITION = 'attachment';

async function sign(body: Record<string, unknown>) {
  const list = body.objects;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_OBJECTS) throw bad(`Send between 1 and ${MAX_OBJECTS} objects.`);
  let specs: ObjectSpec[];
  try { specs = list.map(validateObject); } catch (e) { if (e instanceof KeyError) throw bad(e.message, 'invalid-key'); throw e; }
  if (new Set(specs.map((s) => s.key)).size !== specs.length) throw bad('The same file appears twice.', 'invalid-key');
  const cfg = r2Config();
  const urls = await Promise.all(specs.map(async (s) => ({
    key: s.key,
    url: await presign(cfg, s.key, {
      method: 'PUT', contentType: s.contentType, contentLength: s.size, expiresSeconds: EXPIRES,
      // SVGs are stored as downloads, so a scripted one never runs as a page on the CDN host (docs/backend.md §10).
      contentDisposition: s.contentType === 'image/svg+xml' ? SVG_DISPOSITION : undefined,
    }),
  })));
  return { urls };
}

async function remove(c: Awaited<ReturnType<typeof guard>>, body: Record<string, unknown>) {
  if (typeof body.key !== 'string' || !body.key) throw bad('Say which file.');
  const { data, error } = await c.admin.from('media').select('key, kind, widths, poster').eq('key', body.key).maybeSingle();
  if (error) throw new Error('media lookup failed');
  if (!data) throw new HttpError(404, 'not-found', 'That file isn’t in the library.');
  let keys: string[];
  try { keys = validatedObjectsOf(data as MediaRow); } catch (e) {
    if (e instanceof KeyError) throw bad('That file can’t be deleted here.', 'invalid-key');
    throw e;
  }
  const cfg = r2Config();
  try {
    for (const k of keys) await deleteObject(cfg, k);
  } catch {
    console.error('media: R2 delete failed');
    throw new HttpError(502, 'storage-failed', 'The file couldn’t be removed from storage. Nothing was deleted; try again.');
  }
  const { error: delErr } = await c.admin.from('media').delete().eq('key', body.key);
  if (delErr) throw new Error('media row delete failed');
  return { deleted: true };
}

Deno.serve(handle(async (req, body) => {
  const c = await guard(req, 'cms');
  switch (body.action) {
    case 'sign': return sign(body);
    case 'delete': return remove(c, body);
    default: throw bad('Unknown action.');
  }
}));
