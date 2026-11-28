import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Revokes the session everywhere. If that request fails (offline, outage) the browser's copy is still removed, so the
 * shared .brickbot.ro cookie never keeps a verified session; the original error is then thrown so callers can tell
 * the member the server-side revoke did not go through. (Kept import-free so `node --test` can run it.)
 */
export async function signOutEverywhere(sb: Pick<SupabaseClient, 'auth'>): Promise<void> {
  const { error } = await sb.auth.signOut().catch((e: unknown) => ({ error: e as Error }));
  if (error) {
    await sb.auth.signOut({ scope: 'local' }).catch(() => undefined);
    throw error;
  }
}
