import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveAdmin } from './live';
import { previewAdmin } from './preview';
import type { AdminUser, InviteInput, PermissionChange, PermissionDef } from './types';

/**
 * Every privileged operation of the Admin section. In production each method is an Edge Function that checks the
 * caller's JWT for `admin` (CLAUDE.md §2); reads go through RLS. The in-memory implementation is ./preview.ts. The
 * Supabase one is ./live.ts (Edge Function `admin-users`), passed as `live`.
 *
 * Rule-breaking calls reject with an Error whose message is safe to show (last admin, duplicate email, yourself).
 */
export interface AdminApi {
  listUsers(): Promise<AdminUser[]>;
  /** The `permissions` catalog, in display order. */
  listCatalog(): Promise<PermissionDef[]>;
  invite(input: InviteInput): Promise<AdminUser>;
  resendInvite(userId: string): Promise<void>;
  /** Bans the account in Supabase Auth. It is not deleted, so authorship history stays. */
  deactivate(userId: string): Promise<AdminUser>;
  reactivate(userId: string): Promise<AdminUser>;
  /** Replaces the permission set of each listed user, all or nothing. */
  setPermissions(changes: PermissionChange[]): Promise<AdminUser[]>;
  /** Jump palette items: users by email, ≤ 5. */
  search(query: string): Promise<SearchItem[]>;
}

export const adminApi = defineApi<AdminApi>({ preview: previewAdmin, live: liveAdmin });
