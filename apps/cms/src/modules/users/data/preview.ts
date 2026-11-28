import { logActivity } from '../../../lib/data/activity';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import { rankSearch } from '../../../lib/data/search';
import { recordAudit } from '../../audit/data/preview';
import type { AdminApi } from './api';
import { catalog, users as seedUsers } from './seed';
import type { AdminUser } from './types';

// The preview database. It lives in memory, so a reload starts again from the seed.
let users: AdminUser[] = seedUsers.map((x) => ({ ...x, permissions: [...x.permissions] }));

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const activeAdmins = (list: AdminUser[]) => list.filter((u) => u.status === 'active' && u.permissions.includes('admin'));
const find = (id: string) => {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error('This account no longer exists.');
  return u;
};
const rec = (u: AdminUser) => ({ email: u.email, permissions: [...u.permissions] });
const put = (u: AdminUser) => { users = users.map((x) => (x.id === u.id ? u : x)); };

export const previewAdmin: AdminApi = {
  async listUsers() { await previewDelay(); return users.map((u) => ({ ...u, permissions: [...u.permissions] })); },
  async listCatalog() { await previewDelay(60); return catalog; },

  async invite(input) {
    await previewDelay();
    previewFailSave();
    const email = input.email.trim().toLowerCase();
    if (!emailRe.test(email)) throw new Error('That does not look like an email address.');
    if (users.some((u) => u.email === email)) throw new Error('This email already has an account.');
    const u: AdminUser = { id: `u${Date.now()}`, email, permissions: [...input.permissions], status: 'invited', lastSignInAt: null, addedAt: nowIso() };
    users = [...users, u];
    recordAudit('users', 'insert', email, null, { ...rec(u), banned: false });
    logActivity({ action: 'invited', targetLabel: email, module: 'Users', href: '/admin/users' });
    return u;
  },
  async resendInvite(id) {
    await previewDelay();
    previewFailSave();
    const u = find(id);
    if (u.status !== 'invited') throw new Error('Only pending invites can be sent again.');
    logActivity({ action: 'sent the invite again to', targetLabel: u.email, module: 'Users', href: '/admin/users' });
  },
  async deactivate(id) {
    await previewDelay();
    previewFailSave();
    const u = find(id);
    if (u.email === ME) throw new Error('You cannot deactivate your own account.');
    if (u.status === 'deactivated') return u;
    if (u.status === 'active' && u.permissions.includes('admin') && activeAdmins(users).length <= 1) throw new Error('This is the last active admin. Make someone else an admin first.');
    const next: AdminUser = { ...u, status: 'deactivated' };
    put(next);
    recordAudit('users', 'update', u.email, { email: u.email, banned: false }, { email: u.email, banned: true });
    logActivity({ action: 'deactivated', targetLabel: u.email, module: 'Users', href: '/admin/users' });
    return next;
  },
  async reactivate(id) {
    await previewDelay();
    previewFailSave();
    const u = find(id);
    if (u.status !== 'deactivated') return u;
    const next: AdminUser = { ...u, status: u.lastSignInAt ? 'active' : 'invited' };
    put(next);
    recordAudit('users', 'update', u.email, { email: u.email, banned: true }, { email: u.email, banned: false });
    logActivity({ action: 'reactivated', targetLabel: u.email, module: 'Users', href: '/admin/users' });
    return next;
  },
  async setPermissions(changes) {
    await previewDelay();
    previewFailSave();
    const known = new Set(catalog.map((c) => c.id));
    const next = users.map((u) => {
      const c = changes.find((x) => x.userId === u.id);
      return c ? { ...u, permissions: c.permissions.filter((p) => known.has(p)) } : u;
    });
    for (const c of changes) if (!users.some((u) => u.id === c.userId)) throw new Error('An account in this change no longer exists.');
    if (activeAdmins(next).length === 0) throw new Error('This would leave no active admin. Keep at least one.');
    const changed: AdminUser[] = [];
    for (const u of next) {
      const old = users.find((x) => x.id === u.id)!;
      if (JSON.stringify([...old.permissions].sort()) === JSON.stringify([...u.permissions].sort())) continue;
      changed.push(u);
      recordAudit('user_permissions', 'update', u.email, rec(old), rec(u));
    }
    users = next;
    if (changed.length) {
      logActivity({ action: 'changed permissions of', targetLabel: changed.length === 1 ? changed[0].email : `${changed.length} members`, module: 'Permissions', href: '/admin/permissions' });
    }
    return changed;
  },

  async search(query) {
    await previewDelay(60);
    return rankSearch(query, users.map((u) => ({
      item: { id: u.id, label: u.email, hint: `Member · ${u.status === 'active' ? 'Active' : u.status === 'invited' ? 'Invited' : 'Deactivated'}`, href: `/admin/users?q=${encodeURIComponent(u.email)}` },
      text: u.email,
    })));
  },
};
