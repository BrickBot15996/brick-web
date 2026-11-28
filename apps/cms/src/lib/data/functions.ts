import { sb } from './live-kit';

/** A failed Edge Function call. `message` is safe to show; `code` is the function's error code ('' when it sent none). */
export class FnError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

const OFFLINE = "Can't reach the server. Check your connection.";

/**
 * Calls an Edge Function (`{ action, ...args }` in, JSON out, docs/backend.md §9) as the signed-in member and returns its
 * result. Failures become a `FnError` whose message is the function's own plain sentence; a 401 means the session ended.
 */
export async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
  let res;
  try { res = await sb().functions.invoke<T>(name, { body }); } catch { throw new FnError(OFFLINE, 'network', 0); }
  if (!res.error) return res.data as T;
  const err = res.error as { name?: string; context?: unknown };
  if (err.name === 'FunctionsHttpError' && err.context instanceof Response) {
    const status = err.context.status;
    if (status === 401) throw new FnError('Your session has ended. Reload the page to sign in again.', 'session', status);
    let payload: { error?: { code?: unknown; message?: unknown } } | null = null;
    try { payload = await err.context.json(); } catch { /* not JSON: use the generic line */ }
    const code = typeof payload?.error?.code === 'string' ? payload.error.code : '';
    const message = typeof payload?.error?.message === 'string' && payload.error.message ? payload.error.message
      : status === 403 ? "You don't have permission to do this." : 'Something went wrong. Try again.';
    throw new FnError(message, code, status);
  }
  throw new FnError(OFFLINE, 'network', 0);
}
