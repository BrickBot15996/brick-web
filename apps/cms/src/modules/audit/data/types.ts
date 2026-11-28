export type AuditAction = 'insert' | 'update' | 'delete';
/** A flat field value as the trigger stores it (jsonb). Bilingual fields are { en, ro } objects. */
export type AuditValue = string | number | boolean | null | string[] | { en: string; ro: string };
export type AuditRecord = Record<string, AuditValue>;

/** One row of the audit log: what a database trigger recorded. */
export interface AuditEntry {
  id: string;
  /** ISO. */
  at: string;
  /** Email of the account that made the change. */
  actorEmail: string;
  /** Database table, e.g. "blog_posts". The UI maps it to a readable name and module. */
  table: string;
  action: AuditAction;
  /** A readable name of the changed row: a post title, a sponsor, an email. */
  item: string;
  /** Row before the change (null on insert). */
  before: AuditRecord | null;
  /** Row after the change (null on delete). */
  after: AuditRecord | null;
}

export interface AuditFilters {
  /** Actor email or '' for all. */
  user: string;
  /** Table name or '' for all. */
  table: string;
  /** "YYYY-MM-DD" in Bucharest, inclusive, or ''. */
  from: string;
  to: string;
}
export interface AuditPage { rows: AuditEntry[]; next: string | null; total: number }
export interface AuditTable { id: string; label: string }
