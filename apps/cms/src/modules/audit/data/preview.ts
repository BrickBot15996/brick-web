import { rankSearch } from '../../../lib/data/search';
import { isoToInput } from '../../../lib/dates';
import { nowIso, PREVIEW_ME, previewDelay } from '../../../lib/data/preview-kit';
import type { AuditApi } from './api';
import { knownTables } from './labels';
import { entries as seed } from './seed';
import type { AuditAction, AuditEntry, AuditRecord } from './types';

export const PAGE_SIZE = 20;
let entries: AuditEntry[] = [...seed];

/** What a trigger would write. Other preview stores of this module's family (users, permissions) call it after a change. */
export function recordAudit(table: string, action: AuditAction, item: string, before: AuditRecord | null, after: AuditRecord | null): void {
  entries = [{ id: `au-live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: nowIso(), actorEmail: PREVIEW_ME, table, action, item, before, after }, ...entries];
}

export const previewAudit: AuditApi = {
  async list(f, cursor) {
    await previewDelay();
    const day = (iso: string) => isoToInput(iso).slice(0, 10);
    const all = entries
      .filter((x) => (!f.user || x.actorEmail === f.user) && (!f.table || x.table === f.table) && (!f.from || day(x.at) >= f.from) && (!f.to || day(x.at) <= f.to))
      .sort((a, b) => b.at.localeCompare(a.at));
    const start = cursor ? Number(cursor) : 0;
    const rows = all.slice(start, start + PAGE_SIZE);
    return { rows, next: start + PAGE_SIZE < all.length ? String(start + PAGE_SIZE) : null, total: all.length };
  },
  async listActors() { await previewDelay(60); return [...new Set(entries.map((x) => x.actorEmail))].sort(); },
  async listTables() {
    await previewDelay(60);
    const used = new Set(entries.map((x) => x.table));
    return knownTables().filter((t) => used.has(t.id)).sort((a, b) => a.label.localeCompare(b.label));
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, [{ item: { id: 'audit', label: 'Audit log', hint: 'Admin · who changed what', href: '/admin/audit' }, text: 'audit log changes history who changed what' }]);
  },
};
