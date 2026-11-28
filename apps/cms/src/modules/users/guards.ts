import type { AdminUser } from './data/types';

export const activeAdmins = (users: readonly AdminUser[]) => users.filter((u) => u.status === 'active' && u.permissions.includes('admin'));

/** Why this account cannot be deactivated right now, or null when it can. Mirrors the rules the Edge Function enforces. */
export function deactivateBlock(u: AdminUser, users: readonly AdminUser[], me: string | undefined): string | null {
  if (u.email === me) return 'You cannot deactivate your own account.';
  if (u.status === 'active' && u.permissions.includes('admin') && activeAdmins(users).length <= 1) return 'This is the last active admin. Make someone else an admin first.';
  return null;
}
