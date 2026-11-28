import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { KeyError, objectsOf, validatedObjectsOf, validateObject } from './keys.ts';

const ok = (key: string, contentType: string, size = 1000) => validateObject({ key, contentType, size });
const no = (key: string, contentType: string, size = 1000) => assertThrows(() => ok(key, contentType, size), KeyError);

Deno.test('accepts what media-upload.ts generates', () => {
  ok('seasons/decode/team-photo.k3f9a2-960.webp', 'image/webp');
  ok('site/home/agent-test.abc123-480.webp', 'image/webp');
  ok('sponsors/primaria-focsani.x1y2z3.svg', 'image/svg+xml');
  ok('documents/sponsor-deck-2026-27.q1w2e3.pdf', 'application/pdf', 20 * 1024 * 1024);
  ok('gallery/general/clip.a1b2c3.mp4', 'video/mp4', 90 * 1024 * 1024);
  ok('gallery/general/clip.a1b2c3.poster.webp', 'image/webp');
  ok('projects/brick-by-brick-school/logo.abcdef.svg', 'image/svg+xml');
});

Deno.test('rejects bad folders and names', () => {
  no('secrets/x.abc123.pdf', 'application/pdf');
  no('site/Home/x.abc123-480.webp', 'image/webp');
  no('site/home/x y.abc123-480.webp', 'image/webp');
  no('site/home/ă.abc123-480.webp', 'image/webp');
  no('site/../brand/x.abc123-480.webp', 'image/webp');
  no('/site/home/x.abc123-480.webp', 'image/webp');
  no('site//x.abc123-480.webp', 'image/webp');
  no('x.abc123-480.webp', 'image/webp');
  no('site/home/x.abc12-480.webp', 'image/webp'); // id too short
  no('site/home/x-480.webp', 'image/webp'); // no id
  no('site/home/x.abc123-480.webp?x=1', 'image/webp');
});

Deno.test('extension must match content type; widths only on webp variants', () => {
  no('site/home/x.abc123-480.png', 'image/webp');
  no('site/home/x.abc123.svg', 'image/webp');
  no('site/home/x.abc123.exe', 'application/octet-stream');
  no('site/home/x.abc123-480.pdf', 'application/pdf');
  no('site/home/x.abc123-5000.webp', 'image/webp');
  no('site/home/x.abc123-0480.webp', 'image/webp');
});

Deno.test('size caps', () => {
  no('site/home/x.abc123-480.webp', 'image/webp', 16 * 1024 * 1024);
  no('documents/x.abc123.pdf', 'application/pdf', 31 * 1024 * 1024);
  no('gallery/general/x.abc123.mp4', 'video/mp4', 101 * 1024 * 1024);
  no('site/home/x.abc123-480.webp', 'image/webp', 0);
  no('site/home/x.abc123-480.webp', 'image/webp', 1.5);
});

Deno.test('objectsOf lists variants, single objects and posters', () => {
  assertEquals(objectsOf({ key: 'a/b.abc123', kind: 'image', widths: [480, 960], poster: null }), ['a/b.abc123-480.webp', 'a/b.abc123-960.webp']);
  assertEquals(objectsOf({ key: 'a/b.abc123.mp4', kind: 'video', widths: null, poster: 'a/b.abc123.poster.webp' }), ['a/b.abc123.mp4', 'a/b.abc123.poster.webp']);
  assertEquals(objectsOf({ key: 'seasons/decode/team-photo.webp', kind: 'image', widths: null, poster: null }), ['seasons/decode/team-photo.webp']);
});

const row = (r: Partial<{ key: string; kind: string; widths: number[] | null; poster: string | null }>) =>
  ({ key: 'gallery/general/a.abc123', kind: 'image', widths: [480, 960], poster: null, ...r });
const refused = (r: ReturnType<typeof row>) => assertThrows(() => validatedObjectsOf(r), KeyError);

Deno.test('delete validation: accepts rows the CMS writes', () => {
  assertEquals(validatedObjectsOf(row({})), ['gallery/general/a.abc123-480.webp', 'gallery/general/a.abc123-960.webp']);
  assertEquals(validatedObjectsOf(row({ widths: [200] })), ['gallery/general/a.abc123-200.webp']);
  assertEquals(validatedObjectsOf(row({ key: 'sponsors/x.abc123.svg', kind: 'svg', widths: null })), ['sponsors/x.abc123.svg']);
  assertEquals(validatedObjectsOf(row({ key: 'documents/x.abc123.pdf', kind: 'pdf', widths: null })), ['documents/x.abc123.pdf']);
  assertEquals(
    validatedObjectsOf(row({ key: 'gallery/general/c.abc123.mp4', kind: 'video', widths: null, poster: 'gallery/general/c.abc123.poster.webp' })),
    ['gallery/general/c.abc123.mp4', 'gallery/general/c.abc123.poster.webp'],
  );
  validatedObjectsOf(row({ key: 'gallery/general/c.abc123.mp4', kind: 'video', widths: null })); // clip whose poster failed
});

Deno.test('delete validation: refuses crafted rows (the audited attacks)', () => {
  refused(row({ key: 'brand/logo.svg', kind: 'svg', widths: null })); // hand-uploaded brand file
  refused(row({ key: 'seasons/decode/team-photo.webp', kind: 'image', widths: null })); // placeholder, no id
  refused(row({ key: 'gallery/general/a.abc123', widths: null })); // image without a .webp ending
  refused(row({ key: 'x', widths: [1] }));
  refused(row({ key: '../other/a.abc123' }));
  refused(row({ key: 'gallery/../brand/a.abc123' }));
  refused(row({ key: 'gallery/general/a.abc123', poster: 'brand/wordmark.svg' })); // poster on an image row
  refused(row({ key: 'gallery/general/c.abc123.mp4', kind: 'video', widths: null, poster: 'brand/wordmark.svg' }));
  refused(row({ key: 'gallery/general/c.abc123.mp4', kind: 'video', widths: null, poster: 'gallery/general/other.abc123.poster.webp' }));
  refused(row({ widths: [5000] }));
  refused(row({ widths: [480.5] }));
  refused(row({ widths: [-1] }));
  refused(row({ key: 'gallery/general/a.abc123.svg', kind: 'svg', widths: [480] }));
  refused(row({ kind: 'other' }));
  refused(row({ key: 'secrets/a.abc123' }));
});
