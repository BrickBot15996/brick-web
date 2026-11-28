import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type BrickbotClient = SupabaseClient<Database>;

/** The env shape injected by each app's vite config (only public values). */
interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

/** `.brickbot.ro` on brickbot.ro and its subdomains (SSO), otherwise host-only (e.g. 127.0.0.1, shared across ports). */
function cookieDomain(): string | undefined {
  const host = location.hostname;
  return host === 'brickbot.ro' || host.endsWith('.brickbot.ro') ? '.brickbot.ro' : undefined;
}

export function createBrickbotClient({ url, anonKey }: { url: string; anonKey: string }): BrickbotClient {
  return createBrowserClient<Database>(url, anonKey, {
    cookieOptions: {
      domain: cookieDomain(),
      path: '/',
      sameSite: 'lax',
      secure: location.protocol === 'https:',
    },
  }) as BrickbotClient;
}

let instance: BrickbotClient | undefined;

/** Singleton client configured from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. */
export function getSupabase(): BrickbotClient {
  if (!instance) {
    const env = (import.meta as unknown as { env: SupabaseEnv }).env;
    const url = env.VITE_SUPABASE_URL;
    const anonKey = env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_ANON_KEY).');
    instance = createBrickbotClient({ url, anonKey });
  }
  return instance;
}
