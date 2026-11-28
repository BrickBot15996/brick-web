import { getSupabase } from '@brickbot/supabase';
import { fail } from '../../../lib/data/live-kit';
import { rankSearch } from '../../../lib/data/search';
import { inputToIso } from '../../../lib/dates';
import type { AuditApi } from './api';
import { knownTables } from './labels';
import type { AuditEntry, AuditFilters, AuditRecord } from './types';

const PAGE_SIZE = 20;

/** The next calendar day of "YYYY-MM-DD" (UTC arithmetic on a plain date). */
const nextDay = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** The filters as PostgREST conditions. The range is Bucharest days, inclusive: [from 00:00, day after `to` 00:00). */
function filtered<Q extends { eq(c: string, v: string): Q; gte(c: string, v: string): Q; lt(c: string, v: string): Q }>(q: Q, f: AuditFilters): Q {
  if (f.user) q = q.eq('actor_email', f.user);
  if (f.table) q = q.eq('table_name', f.table);
  if (f.from) q = q.gte('at', inputToIso(`${f.from}T00:00`));
  if (f.to) q = q.lt('at', inputToIso(`${nextDay(f.to)}T00:00`));
  return q;
}

type Row = { id: number; at: string; actor_email: string | null; table_name: string; action: string; item: string; before: unknown; after: unknown };
const toEntry = (r: Row): AuditEntry => ({
  id: String(r.id), at: r.at, actorEmail: r.actor_email ?? 'Automatic', table: r.table_name, action: r.action as AuditEntry['action'], item: r.item,
  before: (r.before as AuditRecord | null) ?? null, after: (r.after as AuditRecord | null) ?? null,
});

export const liveAudit: AuditApi = {
  async list(f, cursor) {
    const sb = getSupabase();
    let page = filtered(sb.from('audit_log').select('*'), f).order('at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE + 1);
    if (cursor) {
      const [at, id] = cursor.split('|');
      page = page.or(`at.lt."${at}",and(at.eq."${at}",id.lt.${Number(id)})`);
    }
    const count = filtered(sb.from('audit_log').select('id', { count: 'exact', head: true }), f);
    const [rows, total] = await Promise.all([page, count]).catch((e) => fail({ message: String(e?.message ?? e) }));
    if (rows.error) return fail(rows.error);
    if (total.error) return fail(total.error);
    const data = rows.data as Row[];
    const shown = data.slice(0, PAGE_SIZE);
    const last = shown[shown.length - 1];
    return { rows: shown.map(toEntry), next: data.length > PAGE_SIZE && last ? `${last.at}|${last.id}` : null, total: total.count ?? 0 };
  },

  /** Every member (admins may read `members`) plus actors seen in the recent log. */
  async listActors() {
    const sb = getSupabase();
    const [m, a] = await Promise.all([
      sb.from('members').select('email'),
      sb.from('audit_log').select('actor_email').order('at', { ascending: false }).limit(2000),
    ]);
    if (m.error) return fail(m.error);
    if (a.error) return fail(a.error);
    const all = new Set<string>([...m.data.map((x) => x.email), ...a.data.map((x) => x.actor_email).filter((x): x is string => !!x)]);
    return [...all].sort();
  },

  /** Tables seen in the most recent 5000 log rows (the column is tiny; there is no distinct in PostgREST). */
  async listTables() {
    const { data, error } = await getSupabase().from('audit_log').select('table_name').order('at', { ascending: false }).limit(5000);
    if (error) return fail(error);
    const used = new Set(data.map((x) => x.table_name));
    return knownTables().filter((t) => used.has(t.id)).concat([...used].filter((id) => !knownTables().some((t) => t.id === id)).map((id) => ({ id, label: id }))).sort((a, b) => a.label.localeCompare(b.label));
  },

  async search(query) {
    return rankSearch(query, [{ item: { id: 'audit', label: 'Audit log', hint: 'Admin · who changed what', href: '/admin/audit' }, text: 'audit log changes history who changed what' }]);
  },
};
