#!/usr/bin/env node
// Local testing helper: a confirmed user with a password and given permissions, plus a signed-in, already-verified session.
//   node scripts/dev-user.mjs <email> <password> [permission…]
// Prints JSON { access_token, refresh_token, session_id } so a headless browser can be signed in without the email code.
// Refuses to run against anything but the local stack. Needs only Node 22.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [emailArg, password, ...permissions] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();
if (!email || !password) {
  console.error('usage: node scripts/dev-user.mjs <email> <password> [permission…]   e.g. cms.website cms.links admin');
  process.exit(2);
}

let status;
try {
  status = execFileSync('supabase', ['status', '-o', 'env'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch { console.error('local stack is not running (supabase start)'); process.exit(1); }
const env = {};
for (const line of status.split('\n')) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) env[m[1]] = m[2];
}
const url = (env.API_URL ?? '').replace(/\/$/, '');
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  console.error('refusing to run: the API URL is not the local stack'); process.exit(1);
}
const service = { apikey: env.SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };

async function call(path, init = {}, h = service) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...h, ...init.headers } });
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} failed: ${res.status} ${body?.msg ?? body?.message ?? body?.error_description ?? ''}`.trim());
  return body;
}

// 1. Create or update the user (confirmed, password set).
const found = await call(`/rest/v1/members?select=user_id&email=ilike.${encodeURIComponent(email)}`);
let userId = found[0]?.user_id;
if (userId) {
  await call(`/auth/v1/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ password, email_confirm: true, ban_duration: 'none' }) });
  await call(`/rest/v1/members?user_id=eq.${userId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ deactivated_at: null }) });
} else {
  userId = (await call('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) })).id;
}

// 2. Replace the permission set (validated against the catalog by the function).
await call('/rest/v1/rpc/set_permissions', { method: 'POST', body: JSON.stringify({ p_user: userId, p_permissions: permissions, p_actor: null }) });

// 3. Sign in with the password, then mark this session as verified (what the email-2fa function does in production).
const session = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) },
  { apikey: env.ANON_KEY, 'Content-Type': 'application/json' });
const claims = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString());
await call('/rest/v1/verified_sessions?on_conflict=session_id', {
  method: 'POST',
  headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify({ session_id: claims.session_id, user_id: userId, method: 'code' }),
});

console.error(`${email}: permissions in token = [${(claims.permissions ?? []).join(', ')}]`);
console.log(JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, session_id: claims.session_id }));
