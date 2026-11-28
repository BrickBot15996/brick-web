// node --test packages/supabase/test: sign-out must clear the stored session even when the logout request fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { signOutEverywhere } from '../src/signout.ts';

const jwt = (exp) => `h.${Buffer.from(JSON.stringify({ sub: 'u', exp })).toString('base64url')}.s`;
const session = () => ({
  access_token: jwt(Math.floor(Date.now() / 1000) + 3600), refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' },
});
const make = async (fetch) => {
  const store = new Map();
  const sb = createClient('http://127.0.0.1:1', 'anon', {
    global: { fetch },
    auth: { storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k) }, autoRefreshToken: false, persistSession: true },
  });
  await sb.auth.setSession({ access_token: session().access_token, refresh_token: 'r' }).catch(() => undefined);
  store.set('sb-127-auth-token', JSON.stringify(session()));
  return { sb, hasSession: async () => (await sb.auth.getSession()).data.session !== null };
};

test('network failure: error surfaces, local session removed', async () => {
  const { sb, hasSession } = await make(() => Promise.reject(new TypeError('fetch failed')));
  assert.equal(await hasSession(), true);
  await assert.rejects(signOutEverywhere(sb));
  assert.equal(await hasSession(), false);
});

test('503: error surfaces, local session removed', async () => {
  const { sb, hasSession } = await make(() => Promise.resolve(new Response('{}', { status: 503 })));
  await assert.rejects(signOutEverywhere(sb));
  assert.equal(await hasSession(), false);
});

test('success: no error, session removed', async () => {
  const { sb, hasSession } = await make(() => Promise.resolve(new Response(null, { status: 204 })));
  await signOutEverywhere(sb);
  assert.equal(await hasSession(), false);
});
