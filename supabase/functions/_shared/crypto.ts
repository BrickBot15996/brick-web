// Hashing and randomness for codes and device tokens. Only hashes are ever stored.

const enc = new TextEncoder();

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}

/** Constant-time comparison of two strings (compares every byte of the longer length). */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** A uniformly random 6-digit code ("004217" is possible). Rejection sampling avoids modulo bias. */
export function randomCode(): string {
  const limit = 4_294_967_296 - (4_294_967_296 % 1_000_000);
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

/** 32 random bytes as base64url (43 characters). */
export function randomToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (const c of b) s += String.fromCharCode(c);
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** What is stored for an emailed code. Bound to the member so a stolen row can't be replayed for another account. */
export const hashCode = (userId: string, code: string) => sha256Hex(`code:${userId}:${code}`);
/** What is stored for a device token. */
export const hashDeviceToken = (token: string) => sha256Hex(`device:${token}`);
