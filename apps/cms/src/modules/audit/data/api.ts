import { defineApi } from '../../../lib/data/module';
import type { SearchItem } from '../../../lib/data/search';
import { liveAudit } from './live';
import { previewAudit } from './preview';
import type { AuditFilters, AuditPage, AuditTable } from './types';

/**
 * The audit log is written by database triggers, never by the CMS, so this interface only reads. The in-memory
 * implementation is ./preview.ts. The Supabase one is ./live.ts, passed as `live`, paging with a keyset cursor.
 */
export interface AuditApi {
  /** One page, newest first. `cursor` is the `next` of the previous page. */
  list(filters: AuditFilters, cursor: string | null): Promise<AuditPage>;
  /** Emails that appear in the log, for the user filter. */
  listActors(): Promise<string[]>;
  /** Tables that appear in the log, for the table filter. */
  listTables(): Promise<AuditTable[]>;
  search(query: string): Promise<SearchItem[]>;
}

export const auditApi = defineApi<AuditApi>({ preview: previewAudit, live: liveAudit });
