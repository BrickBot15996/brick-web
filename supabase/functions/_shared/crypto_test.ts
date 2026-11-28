import { assert, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { hashCode, hashDeviceToken, randomCode, randomToken, safeEqual, sha256Hex } from './crypto.ts';

Deno.test('sha256 known vector', async () => {
  assertEquals(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
Deno.test('safeEqual', () => {
  assert(safeEqual('abc', 'abc'));
  assert(!safeEqual('abc', 'abd'));
  assert(!safeEqual('abc', 'abcd'));
  assert(!safeEqual('', 'a'));
});
Deno.test('codes are six digits and hashes are bound to the user', async () => {
  for (let i = 0; i < 200; i++) assert(/^\d{6}$/.test(randomCode()));
  assertEquals(await hashCode('u1', '123456'), await hashCode('u1', '123456'));
  assertNotEquals(await hashCode('u1', '123456'), await hashCode('u2', '123456'));
  assertNotEquals(await hashCode('u1', '123456'), await hashCode('u1', '123457'));
  assertEquals((await hashCode('u1', '000000')).length, 64);
});
Deno.test('tokens are 43 url-safe characters and unique; device hash differs from plain sha', async () => {
  const a = randomToken();
  assert(/^[A-Za-z0-9_-]{43}$/.test(a));
  assertNotEquals(a, randomToken());
  assertNotEquals(await hashDeviceToken(a), await sha256Hex(a));
});
