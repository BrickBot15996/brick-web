// Cloudflare R2 through its S3 API: presigned PUT URLs (own SigV4 so the content type can be bound) and object delete.
import { AwsClient } from 'npm:aws4fetch@1';
import { toHex } from './crypto.ts';

export interface R2Config { accessKeyId: string; secretAccessKey: string; endpoint: string; bucket: string }

export function r2Config(): R2Config {
  const get = (n: string) => {
    const v = Deno.env.get(n);
    if (!v) throw new Error(`missing ${n}`);
    return v;
  };
  return {
    accessKeyId: get('R2_ACCESS_KEY_ID'),
    secretAccessKey: get('R2_SECRET_ACCESS_KEY'),
    endpoint: get('R2_S3_ENDPOINT').replace(/\/+$/, ''),
    bucket: get('R2_BUCKET_NAME'),
  };
}

const enc = new TextEncoder();
async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(data));
}
const sha = async (s: string) => toHex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
/** RFC 3986 encoding as SigV4 wants it. */
const enc3986 = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * Last line of defence before a key is signed: a key that could name another path or bucket is refused outright,
 * whatever the caller validated. Real keys never contain `%`, backslashes, dot segments or empty segments.
 */
export function assertSafeKey(key: string): void {
  const bad = typeof key !== 'string' || key.length === 0 || key.length > 1024 || key.startsWith('/') || key.includes('\\') ||
    key.includes('%') || key.includes('//') || /[\u0000-\u001f\u007f?#]/.test(key) || key.split('/').some((s) => s === '.' || s === '..' || s.includes('..'));
  if (bad) throw new Error('unsafe object key');
}
export const encodeKey = (key: string) => key.split('/').map(enc3986).join('/');

export interface PresignOptions {
  method?: string;
  /** Bound into the signature: the upload must send exactly this Content-Type. Leave out for none. */
  contentType?: string;
  expiresSeconds?: number;
  /** Bound into the signature: R2 refuses a body of any other length, so the size checked at sign time is the size stored. */
  contentLength?: number;
  /** Bound into the signature and stored as the object's Content-Disposition; the upload must send this exact header. */
  contentDisposition?: string;
  /** For tests: fixed time. */
  now?: Date;
  region?: string;
  service?: string;
  /** For tests with virtual-hosted URLs: the full URL without query. Defaults to `${endpoint}/${bucket}/${key}`. */
  url?: string;
}

/** SigV4 query-string presign (UNSIGNED-PAYLOAD). Returns the full URL. */
export async function presign(cfg: R2Config, key: string, o: PresignOptions = {}): Promise<string> {
  assertSafeKey(key);
  const method = o.method ?? 'PUT';
  const region = o.region ?? 'auto';
  const service = o.service ?? 's3';
  const now = o.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20130524T000000Z
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${region}/${service}/aws4_request`;

  const base = new URL(o.url ?? `${cfg.endpoint}/${enc3986(cfg.bucket)}/${encodeKey(key)}`);
  const headers: Record<string, string> = { host: base.host };
  if (o.contentType) headers['content-type'] = o.contentType;
  if (o.contentLength !== undefined) {
    if (!Number.isInteger(o.contentLength) || o.contentLength < 0) throw new Error('bad content length');
    headers['content-length'] = String(o.contentLength);
  }
  if (o.contentDisposition) headers['content-disposition'] = o.contentDisposition;
  const signedHeaders = Object.keys(headers).sort().join(';');

  const query: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${cfg.accessKeyId}/${scope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(o.expiresSeconds ?? 600)],
    ['X-Amz-SignedHeaders', signedHeaders],
  ];
  const canonicalQuery = query.map(([k, v]) => [enc3986(k), enc3986(v)]).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('&');
  const canonicalHeaders = Object.keys(headers).sort().map((h) => `${h}:${headers[h].trim()}\n`).join('');
  const canonicalRequest = [method, base.pathname, canonicalQuery, canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha(canonicalRequest)].join('\n');

  let k: ArrayBuffer = await hmac(enc.encode(`AWS4${cfg.secretAccessKey}`), day);
  for (const part of [region, service, 'aws4_request']) k = await hmac(k, part);
  const signature = toHex(await hmac(k, toSign));
  return `${base.origin}${base.pathname}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** Deletes one object. S3 answers 204 whether or not it existed. */
export async function deleteObject(cfg: R2Config, key: string): Promise<void> {
  assertSafeKey(key);
  const aws = new AwsClient({ accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey, service: 's3', region: 'auto' });
  const res = await aws.fetch(`${cfg.endpoint}/${enc3986(cfg.bucket)}/${encodeKey(key)}`, { method: 'DELETE' });
  await res.body?.cancel();
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status})`);
}
