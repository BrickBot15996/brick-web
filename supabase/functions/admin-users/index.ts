// Member management for the CMS's Admin section (docs/backend.md §9). Caller must hold `admin` on a verified session.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { handle, HttpError, bad, type Body } from '../_shared/http.ts';
import { guard, type Caller } from '../_shared/guard.ts';

type Status = 'active' | 'invited' | 'deactivated';
interface AdminUser { id: string; email: string; permissions: string[]; status: Status; lastSignInAt: string | null; addedAt: string }
type MemberRow = { user_id: string; email: string; invited_at: string; last_sign_in_at: string | null; deactivated_at: string | null };

const BAN = '876000h'; // about 100 years: banned for good until reactivated
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fail = (status: number, code: string, message: string) => new HttpError(status, code, message);
const db = (error: unknown, what: string): never => {
  console.error(`admin-users: ${what} failed`, (error as { code?: string; message?: string } | null)?.code ?? '', (error as { message?: string } | null)?.message ?? '');
  throw new Error(what);
};

const statusOf = (m: MemberRow): Status => (m.deactivated_at ? 'deactivated' : m.last_sign_in_at ? 'active' : 'invited');

async function loadUser(admin: SupabaseClient, id: string): Promise<AdminUser> {
  const { data: m, error } = await admin.from('members').select('user_id, email, invited_at, last_sign_in_at, deactivated_at').eq('user_id', id).maybeSingle();
  if (error) db(error, 'member lookup');
  if (!m) throw fail(404, 'not-found', 'That member doesn’t exist.');
  const { data: perms, error: pErr } = await admin.from('user_permissions').select('permission').eq('user_id', id);
  if (pErr) db(pErr, 'permission lookup');
  const row = m as MemberRow;
  return {
    id: row.user_id, email: row.email, status: statusOf(row), lastSignInAt: row.last_sign_in_at, addedAt: row.invited_at,
    permissions: (perms ?? []).map((p: { permission: string }) => p.permission).sort(),
  };
}

async function list(admin: SupabaseClient): Promise<AdminUser[]> {
  const [{ data: ms, error }, { data: ps, error: pErr }] = await Promise.all([
    admin.from('members').select('user_id, email, invited_at, last_sign_in_at, deactivated_at').order('invited_at', { ascending: true }),
    admin.from('user_permissions').select('user_id, permission'),
  ]);
  if (error || pErr) db(error ?? pErr, 'list');
  const by = new Map<string, string[]>();
  for (const p of (ps ?? []) as { user_id: string; permission: string }[]) (by.get(p.user_id) ?? by.set(p.user_id, []).get(p.user_id)!).push(p.permission);
  return ((ms ?? []) as MemberRow[]).map((m) => ({
    id: m.user_id, email: m.email, status: statusOf(m), lastSignInAt: m.last_sign_in_at, addedAt: m.invited_at,
    permissions: (by.get(m.user_id) ?? []).sort(),
  }));
}

async function checkedPermissions(admin: SupabaseClient, value: unknown): Promise<string[]> {
  if (!Array.isArray(value) || value.some((p) => typeof p !== 'string')) throw bad('Permissions must be a list of permission ids.');
  const perms = [...new Set(value as string[])];
  const { data, error } = await admin.from('permissions').select('id');
  if (error) db(error, 'catalog lookup');
  const known = new Set((data ?? []).map((r: { id: string }) => r.id));
  const unknown = perms.filter((p) => !known.has(p));
  if (unknown.length) throw bad(`Unknown permission: ${unknown.join(', ')}.`);
  return perms;
}

const userId = (body: Body): string => {
  if (typeof body.userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.userId)) throw bad('Say which member.');
  return body.userId;
};

/** Active admins other than `except`. */
async function otherActiveAdmins(admin: SupabaseClient, except: string): Promise<number> {
  const { data: holders, error } = await admin.from('user_permissions').select('user_id').eq('permission', 'admin').neq('user_id', except);
  if (error) db(error, 'admin count');
  const ids = (holders ?? []).map((r: { user_id: string }) => r.user_id);
  if (!ids.length) return 0;
  const { data, error: mErr } = await admin.from('members').select('user_id').in('user_id', ids).is('deactivated_at', null);
  if (mErr) db(mErr, 'admin count');
  return data?.length ?? 0;
}

const authUrl = () => (Deno.env.get('AUTH_URL') ?? '').replace(/\/+$/, '');

async function invite(c: Caller, body: Body): Promise<AdminUser> {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) throw bad('Enter a valid email address.');
  const perms = await checkedPermissions(c.admin, body.permissions ?? []);

  const { data: existing } = await c.admin.from('members').select('user_id').ilike('email', email).maybeSingle();
  if (existing) throw fail(409, 'email-taken', 'That email already has an account.');

  const { data, error } = await c.admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${authUrl()}/invite` });
  if (error || !data.user) {
    if (error?.status === 422 || /already/i.test(error?.message ?? '')) throw fail(409, 'email-taken', 'That email already has an account.');
    if (error?.status === 429) throw fail(429, 'rate-limited', 'Too many emails were sent just now. Try again in a little while.');
    console.error(`admin-users: invite failed (${error?.status ?? '?'})`);
    throw fail(502, 'send-failed', 'We couldn’t send the invite. Try again in a moment.');
  }
  const id = data.user.id;
  try {
    const { error: e1 } = await c.admin.rpc('admin_set_member', { p_user: id, p_deactivated_at: null, p_invited_by: c.userId, p_actor: c.userId });
    if (e1) throw e1;
    const { error: e2 } = await c.admin.rpc('set_permissions', { p_user: id, p_permissions: perms, p_actor: c.userId });
    if (e2) throw e2;
  } catch {
    // The account was never usable, so removing it leaves no history behind.
    await c.admin.auth.admin.deleteUser(id);
    throw new Error('invite follow-up failed');
  }
  return loadUser(c.admin, id);
}

async function resend(c: Caller, body: Body): Promise<AdminUser> {
  const id = userId(body);
  const u = await loadUser(c.admin, id);
  if (u.status === 'deactivated') throw fail(409, 'deactivated', 'This account is deactivated. Reactivate it first.');
  const { data, error } = await c.admin.auth.admin.getUserById(id);
  if (error || !data.user) throw fail(404, 'not-found', 'That member doesn’t exist.');
  if (u.status !== 'invited' || data.user.last_sign_in_at || data.user.email_confirmed_at) {
    throw fail(409, 'already-active', 'This member has already set up their account. They can use “Forgot password” if they are locked out.');
  }
  // GoTrue re-sends the invite for a user that has not accepted it yet.
  const { error: e } = await c.admin.auth.admin.inviteUserByEmail(u.email, { redirectTo: `${authUrl()}/invite` });
  if (e) {
    if (e.status === 429) throw fail(429, 'rate-limited', 'Too many emails were sent just now. Try again in a little while.');
    console.error(`admin-users: resend failed (${e.status ?? '?'})`);
    throw fail(502, 'send-failed', 'We couldn’t send the invite. Try again in a moment.');
  }
  return loadUser(c.admin, id);
}

async function deactivate(c: Caller, body: Body): Promise<AdminUser> {
  const id = userId(body);
  if (id === c.userId) throw fail(409, 'self', 'You can’t deactivate your own account.');
  const u = await loadUser(c.admin, id);
  if (u.status === 'deactivated') return u;
  if (u.permissions.includes('admin') && (await otherActiveAdmins(c.admin, id)) < 1) {
    throw fail(409, 'last-admin', 'This is the last active admin. Make someone else an admin first.');
  }
  // Lock out first (is_member() reads deactivated_at). The function also ends every Auth session (refresh tokens
  // included) and drops the second-factor state; then the ban stops new sign-ins.
  const { error } = await c.admin.rpc('admin_set_member', { p_user: id, p_deactivated_at: new Date().toISOString(), p_invited_by: null, p_actor: c.userId });
  if (error) db(error, 'deactivate');
  const { error: banErr } = await c.admin.auth.admin.updateUserById(id, { ban_duration: BAN });
  if (banErr) db(banErr, 'ban');
  return loadUser(c.admin, id);
}

async function reactivate(c: Caller, body: Body): Promise<AdminUser> {
  const id = userId(body);
  const u = await loadUser(c.admin, id);
  if (u.status !== 'deactivated') return u;
  const { error: banErr } = await c.admin.auth.admin.updateUserById(id, { ban_duration: 'none' });
  if (banErr) db(banErr, 'unban');
  const { error } = await c.admin.rpc('admin_set_member', { p_user: id, p_deactivated_at: null, p_invited_by: null, p_actor: c.userId });
  if (error) db(error, 'reactivate');
  return loadUser(c.admin, id);
}

async function setPermissions(c: Caller, body: Body): Promise<AdminUser> {
  const id = userId(body);
  const perms = await checkedPermissions(c.admin, body.permissions);
  const u = await loadUser(c.admin, id);
  if (u.permissions.includes('admin') && !perms.includes('admin')) {
    if (id === c.userId) throw fail(409, 'self', 'You can’t remove your own admin permission. Ask another admin.');
    if (u.status !== 'deactivated' && (await otherActiveAdmins(c.admin, id)) < 1) {
      throw fail(409, 'last-admin', 'This is the last active admin. Make someone else an admin first.');
    }
  }
  const { error } = await c.admin.rpc('set_permissions', { p_user: id, p_permissions: perms, p_actor: c.userId });
  if (error) db(error, 'set_permissions');
  return loadUser(c.admin, id);
}

Deno.serve(handle(async (req, body) => {
  const c = await guard(req, 'admin');
  switch (body.action) {
    case 'list': return list(c.admin);
    case 'invite': return invite(c, body);
    case 'resend': return resend(c, body);
    case 'deactivate': return deactivate(c, body);
    case 'reactivate': return reactivate(c, body);
    case 'setPermissions': return setPermissions(c, body);
    default: throw bad('Unknown action.');
  }
}));
