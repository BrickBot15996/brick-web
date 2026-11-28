import { fieldLabel } from './labels';
import type { AuditEntry, AuditValue } from './types';

export interface DiffRow {
  key: string;
  label: string;
  before: AuditValue | undefined;
  after: AuditValue | undefined;
  /** True when the value differs (always for an insert or delete). */
  changed: boolean;
}

/** Bilingual values are compared and shown per language: "Title (English)" and "Title (Romanian)". */
function flatten(rec: Record<string, AuditValue> | null): Map<string, { label: string; value: AuditValue }> {
  const out = new Map<string, { label: string; value: AuditValue }>();
  if (!rec) return out;
  for (const [k, v] of Object.entries(rec)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.set(`${k}.en`, { label: `${fieldLabel(k)} (English)`, value: v.en });
      out.set(`${k}.ro`, { label: `${fieldLabel(k)} (Romanian)`, value: v.ro });
    } else out.set(k, { label: fieldLabel(k), value: v });
  }
  return out;
}

const same = (a: AuditValue | undefined, b: AuditValue | undefined) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function diffEntry(e: AuditEntry): DiffRow[] {
  const b = flatten(e.before), a = flatten(e.after);
  const keys = [...new Set([...b.keys(), ...a.keys()])];
  return keys.map((key) => {
    const bv = b.get(key)?.value, av = a.get(key)?.value;
    return { key, label: (a.get(key) ?? b.get(key))!.label, before: bv, after: av, changed: e.action !== 'update' || !same(bv, av) };
  });
}
