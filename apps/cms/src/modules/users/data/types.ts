/** One row of the `permissions` catalog. New platforms add rows; nothing in this module names a specific permission. */
export interface PermissionDef {
  id: string;
  /** Short plain label for headings. */
  label: string;
  /** One sentence: what holding it allows. */
  description: string;
}

/** active = signed in at least once; invited = invite sent, no password yet; deactivated = banned in Auth (never deleted). */
export type UserStatus = 'active' | 'invited' | 'deactivated';

/** A team account. Accounts are emails only (PRODUCT.md): no name, avatar or profile. */
export interface AdminUser {
  id: string;
  email: string;
  permissions: string[];
  status: UserStatus;
  /** ISO, null when the member never signed in. */
  lastSignInAt: string | null;
  /** ISO of when the account was invited. */
  addedAt: string;
}

export interface InviteInput { email: string; permissions: string[] }
export interface PermissionChange { userId: string; permissions: string[] }
