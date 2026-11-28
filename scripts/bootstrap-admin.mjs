#!/usr/bin/env node
// Invite the first admin and grant cms.website, cms.links and admin. Idempotent.
//   node scripts/bootstrap-admin.mjs <email> [--local]
// Production: reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and AUTH_URL from the root .env (values are never printed).
// --local: the local stack (http://127.0.0.1:54321), keys from `supabase status`, invite links go to the local auth app.
// Needs only Node 22 (plain fetch); no packages.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PERMISSIONS = ['cms.website', 'cms.links', 'admin'];

const args = process.argv.slice(2);
const local = args.includes('--local');
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('usage: node scripts/bootstrap-admin.mjs <email> [--local]');
  process.exit(2);
}

/** Minimal .env parser. Lines that are not KEY=VALUE (the file may hold a pasted HTML snippet) are skipped. */
function readEnv() {
  const out = {};
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}

function localKeys() {
  const text = execFileSync('supabase', ['status', '-o', 'env'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m) env[m[1]] = m[2];
  }
  if (!env.API_URL || !env.SERVICE_ROLE_KEY) throw new Error('local stack is not running (supabase start)');
  return { url: env.API_URL, key: env.SERVICE_ROLE_KEY, authUrl: 'http://127.0.0.1:5174' };
}

let url, key, authUrl;
if (local) {
  ({ url, key, authUrl } = localKeys());
} else {
  const env = readEnv();
  url = env.SUPABASE_URL; key = env.SUPABASE_SERVICE_ROLE_KEY; authUrl = env.AUTH_URL;
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'AUTH_URL'].filter((k) => !env[k]);
  if (missing.length) { console.error(`missing in .env: ${missing.join(', ')}`); process.exit(1); }
}
url = url.replace(/\/$/, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function call(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} failed: ${res.status} ${body?.msg ?? body?.message ?? body?.error_description ?? ''}`.trim());
  return body;
}

// 1. Is there a member already? (members mirrors auth.users by trigger.)
const found = await call(`/rest/v1/members?select=user_id,last_sign_in_at,deactivated_at&email=ilike.${encodeURIComponent(email)}`);
let userId = found[0]?.user_id;
let state;

if (userId) {
  state = found[0].last_sign_in_at ? 'already active' : 'already invited';
} else {
  const redirect = encodeURIComponent(`${authUrl.replace(/\/$/, '')}/set-password?kind=invite`);
  const user = await call(`/auth/v1/invite?redirect_to=${redirect}`, { method: 'POST', body: JSON.stringify({ email }) });
  userId = user.id;
  state = 'invited';
}

// 2. Grants (granted_by stays null: nobody invited the first admin). Duplicates are ignored.
await call('/rest/v1/user_permissions?on_conflict=user_id,permission', {
  method: 'POST',
  headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
  body: JSON.stringify(PERMISSIONS.map((permission) => ({ user_id: userId, permission }))),
});

console.log(`${email}: ${state}; permissions: ${PERMISSIONS.join(', ')}.`);
if (state === 'invited') console.log(local ? 'The invite email is in Mailpit: http://127.0.0.1:54324' : 'The invite email has been sent.');
