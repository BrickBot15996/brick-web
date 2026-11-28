import { getSupabase } from '@brickbot/supabase';
import type { Bilingual, Edited } from './types';

/** The Supabase client, created on first use (so importing a live module never throws while unconfigured). */
export const sb = () => getSupabase();

/** Select fragment: the member who last edited a row. Use as `.select(`*, ${EDITED_BY}`)`; `toEdited` reads it. */
export const EDITED_BY = 'editor:members!updated_by(email)' as const;
/** Select fragment: the member who created a row; `createdBy` reads it. */
export const CREATED_BY = 'creator:members!created_by(email)' as const;

type DbError = { message?: string; code?: string; details?: string | null; hint?: string | null };

/** "short_urls_slug_key" or "Key (slug)=(x)" -> the column name, to say what was taken. */
function takenField(e: DbError, names: Record<string, string>): string {
  const col = /Key \(([^)]+)\)/.exec(e.details ?? '')?.[1]?.split(',')[0]?.trim();
  const con = /constraint "([^"]+)"/.exec(e.message ?? '')?.[1];
  const key = [con, col].find((k) => k && names[k]);
  if (key) return names[key];
  return (col ?? 'value').replace(/_/g, ' ');
}

/**
 * Turns a Supabase/Postgres error into an Error whose message is safe to show; never leaks SQL.
 * `names` optionally maps a constraint or column name to a noun ("slug") for the "already taken" message.
 */
export function fail(error: DbError, names: Record<string, string> = {}): never {
  const code = error.code ?? '';
  const msg = error.message ?? '';
  const custom = !!msg && !/violates|duplicate key|^new row|^JWT|fetch|network|permission denied|row-level security/i.test(msg) && /^(P0001|23\d\d\d)$/.test(code);
  if (code === '23505') throw new Error(`That ${takenField(error, names)} is already taken.`);
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) throw new Error("You don't have permission to change this.");
  if (code === 'PGRST301' || code === 'PGRST303' || /^JWT/i.test(msg)) throw new Error('Your session has ended. Reload the page to sign in again.');
  if (custom) throw new Error(msg);
  if (code === '23514') throw new Error("One of the values isn't allowed. Check the fields and try again.");
  if (code === '23503') throw new Error('This item is still in use, or refers to something that no longer exists.');
  if (!code && /fetch|network|load failed|timeout/i.test(msg)) throw new Error("Can't reach the server. Check your connection.");
  console.warn('Supabase error', code, msg);
  throw new Error('Something went wrong. Try again.');
}

type Names = Record<string, string>;
type Response = { data: unknown; error: DbError | null };
/** The success data of a query: the row for `.single()`, `Row | null` for `.maybeSingle()`, the array for a list. */
type DataOf<Q> = Q extends PromiseLike<infer R> ? (R extends { error: null; data: infer D } ? D : never) : never;

/**
 * Awaits a query and returns its data, or throws a safe Error (see `fail`). Network failures that throw are mapped too.
 * `.single()` gives the row (never null), `.maybeSingle()` gives `Row | null`, a list query gives the array.
 */
export async function unwrap<Q extends PromiseLike<Response>>(query: Q, names?: Names): Promise<DataOf<Q>>;
export async function unwrap(query: PromiseLike<Response>, names?: Names): Promise<unknown> {
  let res;
  try { res = await query; } catch (e) { return fail({ message: e instanceof Error ? e.message : String(e) }, names); }
  if (res.error) return fail(res.error, names);
  return res.data;
}

/** `Edited` from a row selected with `*, ${EDITED_BY}`. The editor reads '' if the member row is gone. */
export const toEdited = (row: { updated_at: string; editor?: { email: string } | null }): Edited =>
  ({ editedBy: row.editor?.email ?? '', editedAt: row.updated_at });

/** Email of the creator from a row selected with `${CREATED_BY}`. */
export const createdBy = (row: { creator?: { email: string } | null }): string => row.creator?.email ?? '';

/** A jsonb `{en, ro}` as `Bilingual`; anything malformed reads as empty strings. */
export function bilingual(v: unknown): Bilingual {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return { en: typeof o.en === 'string' ? o.en : '', ro: typeof o.ro === 'string' ? o.ro : '' };
}
