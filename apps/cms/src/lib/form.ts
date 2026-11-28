import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Bilingual } from './data';

/**
 * Form state for every editor of the list → edit pattern. A module supplies the starting values, a pure `validate`
 * and a `save`; the hook owns the rest: dirty tracking, the paused check (a field is checked ~900 ms after typing
 * stops, on blur when not empty, and on save; an error clears the moment the value is valid), translation gaps and the
 * save lifecycle. Field paths are dotted ("name.en", "stats.0.value").
 */
export type Errors = Record<string, string>;
export const CHECK_DELAY = 900;

/** Throw from `save` to put the message under a specific field instead of in the save bar. */
export class FieldError extends Error {
  constructor(public path: string, message: string) { super(message); }
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const copy: unknown = Array.isArray(obj) ? [...obj] : { ...(obj as object) };
  const rec = copy as Record<string, unknown>;
  rec[head] = rest.length ? setPath(rec[head], rest.join('.'), value) : value;
  return copy as T;
}

const isBilingual = (v: unknown): v is Bilingual => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const k = Object.keys(v);
  return k.length === 2 && 'en' in v && 'ro' in v && typeof (v as Bilingual).en === 'string' && typeof (v as Bilingual).ro === 'string';
};

/** Which language a pair lacks while the other has text. Both empty is not "missing": that is a required-field question. */
export function missingIn(v: Bilingual): 'en' | 'ro' | null {
  const en = v.en.trim() !== '', ro = v.ro.trim() !== '';
  return en && !ro ? 'ro' : ro && !en ? 'en' : null;
}

export function countMissing(values: unknown): { en: number; ro: number } {
  const n = { en: 0, ro: 0 };
  const walk = (v: unknown) => {
    if (isBilingual(v)) { const m = missingIn(v); if (m) n[m]++; return; }
    if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(values);
  return n;
}

export function missingSummary(m: { en: number; ro: number }): string {
  const part = (n: number, lang: string) => `${n} ${n === 1 ? 'field' : 'fields'} missing ${lang}`;
  if (m.ro && m.en) return `${part(m.ro, 'Romanian')}, ${m.en} missing English`;
  return m.ro ? part(m.ro, 'Romanian') : m.en ? part(m.en, 'English') : '';
}

export interface FormApi<T> {
  values: T;
  /** The values as they were when typing last paused (CHECK_DELAY), on blur, on a structural change, or on save. Translation gaps are read from here, so a language is not flagged missing while someone is still typing. */
  settled: T;
  /** Errors currently shown (after the paused check), by field path. */
  errors: Errors;
  dirty: boolean;
  /** Reads the live state, for use in navigation blockers. */
  isDirty: () => boolean;
  /** Translation gaps in `settled`. */
  missing: { en: number; ro: number };
  saving: boolean;
  /** A save-level message: the save failed, or fields need fixing. */
  saveError: string | null;
  /** Changes whenever a save succeeds. */
  savedAt: number | null;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  /** Structural change (add, remove, move). */
  update: (fn: (v: T) => T) => void;
  blur: (path: string) => void;
  save: () => Promise<void>;
  discard: () => void;
  /** Treats the current values as saved, e.g. right before navigating away after a delete. */
  markClean: () => void;
}

export function useEditForm<T>(opts: {
  initial: T;
  validate: (v: T) => Errors;
  /** Persists the values; the result is passed to onSaved. */
  save: (v: T) => Promise<unknown>;
  onSaved?: (result: unknown, saved: T) => void;
  /** Adjusts the next values after a field changed (derived fields). Runs in event handlers only. */
  derive?: (next: T, changed: string) => T;
}): FormApi<T> {
  const [values, setValues] = useState<T>(opts.initial);
  const [settled, setSettled] = useState<T>(opts.initial);
  const [base, setBase] = useState<T>(opts.initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const live = useRef(values);
  const baseRef = useRef(base);
  const o = useRef(opts);
  o.current = opts;
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { const t = timers.current; return () => { t.forEach(clearTimeout); clearTimeout(settleTimer.current); }; }, []);

  /** Brings `settled` up to the live values: right away, or after the typing pause. */
  const settle = useCallback((delay = 0) => {
    clearTimeout(settleTimer.current);
    if (delay > 0) settleTimer.current = setTimeout(() => setSettled(live.current), delay);
    else setSettled(live.current);
  }, []);

  const commit = useCallback((next: T) => {
    live.current = next;
    setValues(next);
    // An error clears as soon as its value is valid; nothing new appears until the pause.
    const now = o.current.validate(next);
    setErrors((e) => {
      const keep = Object.fromEntries(Object.entries(e).filter(([k]) => k in now));
      return Object.keys(keep).length === Object.keys(e).length ? e : keep;
    });
    setSaveError((m) => (m && Object.keys(now).length === 0 ? null : m));
  }, []);

  const check = useCallback((path: string) => {
    const now = o.current.validate(live.current);
    setErrors((e) => {
      const next = { ...e };
      if (now[path]) next[path] = now[path]; else delete next[path];
      return next;
    });
  }, []);

  const set = useCallback((path: string, value: unknown) => {
    let next = setPath(live.current, path, value);
    if (o.current.derive) next = o.current.derive(next, path);
    commit(next);
    settle(CHECK_DELAY);
    clearTimeout(timers.current.get(path));
    timers.current.set(path, setTimeout(() => check(path), CHECK_DELAY));
  }, [commit, check, settle]);

  const update = useCallback((fn: (v: T) => T) => { commit(fn(live.current)); settle(); }, [commit, settle]);

  const blur = useCallback((path: string) => {
    clearTimeout(timers.current.get(path));
    settle();
    const v = getPath(live.current, path);
    if (typeof v === 'string' ? v.trim() !== '' : v != null) check(path);
  }, [check, settle]);

  const isDirty = useCallback(() => JSON.stringify(live.current) !== JSON.stringify(baseRef.current), []);

  const markClean = useCallback(() => { baseRef.current = live.current; setBase(live.current); }, []);

  const save = useCallback(async () => {
    settle();
    const now = o.current.validate(live.current);
    const paths = Object.keys(now);
    if (paths.length) {
      setErrors(now);
      setSaveError(paths.length === 1 ? 'Fix the highlighted field to save.' : `Fix the ${paths.length} highlighted fields to save.`);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const snapshot = live.current;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await o.current.save(snapshot);
      baseRef.current = snapshot;
      setBase(snapshot);
      setSavedAt(Date.now());
      o.current.onSaved?.(result, snapshot);
    } catch (e) {
      if (e instanceof FieldError) {
        setErrors((x) => ({ ...x, [e.path]: e.message }));
        setSaveError('Fix the highlighted field to save.');
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      } else {
        setSaveError(e instanceof Error && e.message ? `Couldn’t save: ${e.message}` : 'Couldn’t save. Try again.');
      }
    } finally {
      setSaving(false);
    }
  }, [settle]);

  const discard = useCallback(() => {
    timers.current.forEach(clearTimeout);
    clearTimeout(settleTimer.current);
    live.current = baseRef.current;
    setValues(baseRef.current);
    setSettled(baseRef.current);
    setErrors({});
    setSaveError(null);
  }, []);

  const get = useCallback((path: string) => getPath(live.current, path), []);

  return {
    values, settled, errors, dirty: JSON.stringify(values) !== JSON.stringify(base), isDirty, missing: countMissing(settled),
    saving, saveError, savedAt, get, set, update, blur, save, discard, markClean,
  };
}

// The fields read the form from context so a module's editor only names them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormContext = createContext<FormApi<any> | null>(null);
export function useForm(): FormApi<Record<string, unknown>> {
  const f = useContext(FormContext);
  if (!f) throw new Error('Field outside an editor');
  return f;
}

let n = 0;
/** A stable key for a repeatable item, so reordering keeps each row's state and focus. */
export const uid = () => `k${Date.now().toString(36)}${(n++).toString(36)}`;
