import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { assertRejects, assertThrows } from 'jsr:@std/assert@1';
import { assertSafeKey, deleteObject, presign } from './r2.ts';

// The worked example in AWS's "Authenticating Requests: Using Query Parameters" documentation.
Deno.test('SigV4 presign matches the AWS documentation vector', async () => {
  const url = await presign(
    { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', endpoint: '', bucket: '' },
    'test.txt',
    { method: 'GET', region: 'us-east-1', expiresSeconds: 86400, now: new Date('2013-05-24T00:00:00Z'), url: 'https://examplebucket.s3.amazonaws.com/test.txt' },
  );
  assertEquals(new URL(url).searchParams.get('X-Amz-Signature'), 'aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404');
});

Deno.test('PUT presign binds the content type and expiry', async () => {
  const url = await presign(
    { accessKeyId: 'AK', secretAccessKey: 'SK', endpoint: 'https://acct.r2.cloudflarestorage.com', bucket: 'cdn' },
    'site/home/x.abc123-480.webp', { contentType: 'image/webp' },
  );
  const u = new URL(url);
  assertEquals(u.host, 'acct.r2.cloudflarestorage.com');
  assertEquals(u.pathname, '/cdn/site/home/x.abc123-480.webp');
  assertEquals(u.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
  assertEquals(u.searchParams.get('X-Amz-Expires'), '600');
  assertStringIncludes(u.searchParams.get('X-Amz-Credential')!, '/auto/s3/aws4_request');
  const other = await presign(
    { accessKeyId: 'AK', secretAccessKey: 'SK', endpoint: 'https://acct.r2.cloudflarestorage.com', bucket: 'cdn' },
    'site/home/x.abc123-480.webp', { contentType: 'image/svg+xml' },
  );
  assertEquals(url === other, false);
});

const CFG = { accessKeyId: 'AK', secretAccessKey: 'SK', endpoint: 'https://acct.r2.cloudflarestorage.com', bucket: 'cdn' };

Deno.test('PUT presign binds content-length (and content-disposition for SVG)', async () => {
  const base = { contentType: 'image/webp', now: new Date('2026-01-01T00:00:00Z') };
  const a = new URL(await presign(CFG, 'site/home/x.abc123-480.webp', { ...base, contentLength: 1000 }));
  assertEquals(a.searchParams.get('X-Amz-SignedHeaders'), 'content-length;content-type;host');
  const b = new URL(await presign(CFG, 'site/home/x.abc123-480.webp', { ...base, contentLength: 1001 }));
  assertEquals(a.searchParams.get('X-Amz-Signature') === b.searchParams.get('X-Amz-Signature'), false);
  const svg = new URL(await presign(CFG, 'sponsors/x.abc123.svg', { contentType: 'image/svg+xml', contentLength: 10, contentDisposition: 'attachment' }));
  assertEquals(svg.searchParams.get('X-Amz-SignedHeaders'), 'content-disposition;content-length;content-type;host');
  await assertRejects(() => presign(CFG, 'a/b.abc123.webp', { contentLength: -1 }));
});

Deno.test('keys that could leave their path are refused before signing', async () => {
  for (const k of ['../x', 'a/../b', '/a/b', 'a//b', 'a\\b', 'a/%2e%2e/b', 'a/%2E%2E/b', 'a/b%2fc', 'a/./b', 'a/b..c', '', 'a/b?x=1', 'a/b#c', 'a/b\n']) {
    assertThrows(() => assertSafeKey(k), Error, 'unsafe', `sync ${JSON.stringify(k)}`);
    await assertRejects(() => presign(CFG, k, { contentType: 'image/webp' }), Error, 'unsafe');
    await assertRejects(() => deleteObject(CFG, k), Error, 'unsafe');
  }
  assertSafeKey('seasons/decode/team-photo.k3f9a2-960.webp');
});
