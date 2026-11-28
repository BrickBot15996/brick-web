import { logActivity } from '../../../lib/data/activity';
import { FnError, invokeFn } from '../../../lib/data/functions';
import { sb, unwrap } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import type { AdminApi } from './api';
import type { AdminUser, PermissionDef } from './types';

type Action = 'list' | 'invite' | 'resend' | 'deactivate' | 'reactivate' | 'setPermissions';

/** The preview's plain sentences for the rules the function enforces (the function's own text is used for anything else). */
const BY_CODE: Record<string, string> = {
  'email-taken': 'This email already has an account.',
  'last-admin': 'This is the last active admin. Make someone else an admin first.',
  deactivated: 'This account is deactivated. Reactivate it first.',
  'already-active': 'This member has already set up their account. They can use “Forgot password” if they are locked out.',
  'not-found': 'This account no longer exists.',
};
const SELF: Partial<Record<Action, string>> = {
  deactivate: 'You cannot deactivate your own account.',
  setPermissions: 'You cannot remove your own admin permission. Ask another admin.',
};

async function call<T>(action: Action, args: Record<string, unknown> = {}): Promise<T> {
  try {
    return await invokeFn<T>('admin-users', { action, ...args });
  } catch (e) {
    if (e instanceof FnError) {
      const text = e.code === 'self' ? SELF[action] : BY_CODE[e.code];
      if (text) throw new Error(text);
    }
    throw e;
  }
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

export const liveAdmin: AdminApi = {
  listUsers: () => call<AdminUser[]>('list'),

  async listCatalog() {
    const rows = await unwrap(sb().from('permissions').select('id, label, description').order('sort'));
    return rows.map((r): PermissionDef => ({ id: r.id, label: r.label, description: r.description }));
  },

  async invite(input) {
    const u = await call<AdminUser>('invite', { email: input.email.trim(), permissions: input.permissions });
    logActivity({ action: 'invited', targetLabel: u.email, module: 'Users', href: '/admin/users' });
    return u;
  },
  async resendInvite(userId) {
    const u = await call<AdminUser>('resend', { userId });
    logActivity({ action: 'sent the invite again to', targetLabel: u.email, module: 'Users', href: '/admin/users' });
  },
  async deactivate(userId) {
    const u = await call<AdminUser>('deactivate', { userId });
    logActivity({ action: 'deactivated', targetLabel: u.email, module: 'Users', href: '/admin/users' });
    return u;
  },
  async reactivate(userId) {
    const u = await call<AdminUser>('reactivate', { userId });
    logActivity({ action: 'reactivated', targetLabel: u.email, module: 'Users', href: '/admin/users' });
    return u;
  },

  /**
   * One `setPermissions` call per member (never direct table writes). The function checks its guards per call, so changes
   * that keep or add `admin` go first and those that remove it go last: a batch that hands `admin` from one member to
   * another then works. It is not a transaction: if a call fails, the ones before it stay saved and the message says so.
   */
  async setPermissions(changes) {
    const before = new Map((await call<AdminUser[]>('list')).map((u) => [u.id, u]));
    const todo = changes.filter((c) => { const u = before.get(c.userId); return !u || !sameSet(u.permissions, c.permissions); });
    const removesAdmin = (c: { userId: string; permissions: string[] }) => !!before.get(c.userId)?.permissions.includes('admin') && !c.permissions.includes('admin');
    todo.sort((a, b) => Number(removesAdmin(a)) - Number(removesAdmin(b)));
    const changed: AdminUser[] = [];
    for (const c of todo) {
      try {
        changed.push(await call<AdminUser>('setPermissions', { userId: c.userId, permissions: c.permissions }));
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : 'Try again.';
        if (changed.length === 0) throw e;
        throw new Error(`${msg} ${changed.length} of ${todo.length} ${todo.length === 1 ? 'member was' : 'members were'} updated before it stopped.`);
      }
    }
    if (changed.length) {
      logActivity({ action: 'changed permissions of', targetLabel: changed.length === 1 ? changed[0].email : `${changed.length} members`, module: 'Permissions', href: '/admin/permissions' });
    }
    return changed;
  },

  async search(query) {
    const rows = await unwrap(sb().from('members').select('user_id, email, last_sign_in_at, deactivated_at').order('email'));
    return rankSearch(query, rows.map((m) => {
      const status = m.deactivated_at ? 'Deactivated' : m.last_sign_in_at ? 'Active' : 'Invited';
      return { item: { id: m.user_id, label: m.email, hint: `Member · ${status}`, href: `/admin/users?q=${encodeURIComponent(m.email)}` }, text: m.email };
    }));
  },
};
