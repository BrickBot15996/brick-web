import { useEffect, useState } from 'react';

export const PAUSE_MS = 900;

export function emailProblem(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'Enter your email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'That doesn’t look like an email address. Check for typos.';
  return undefined;
}

/**
 * Checks a field once the member stops typing (or leaves it), not on every keystroke and not only on submit.
 * An error disappears the moment the value becomes valid. Empty fields are only flagged on blur or submit.
 */
export function usePausedCheck(value: string, check: (v: string) => string | undefined) {
  const [error, setError] = useState<string | undefined>();
  const problem = check(value);

  useEffect(() => {
    if (!problem) { setError(undefined); return; }
    setError((shown) => (shown ? problem : shown)); // already flagged: keep the message current while they fix it
    if (!value) return;
    const t = setTimeout(() => setError(problem), PAUSE_MS);
    return () => clearTimeout(t);
  }, [value, problem]);

  return {
    error,
    /** whether the value is fine right now */
    ok: !problem,
    /** flag immediately, e.g. on blur (non-empty only) or on submit (always) */
    reveal: (includeEmpty = false) => { if (problem && (value || includeEmpty)) setError(problem); },
  };
}
