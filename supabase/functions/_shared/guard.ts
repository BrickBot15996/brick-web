import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { HttpError } from './http.ts';

export type Claims = { sub: string; session_id?: string; amr?: { method: string; timestamp?: number }[]; email?: string };

export interface Caller {
  userId: string;
  email: string;
  jwt: string;
  claims: Claims;
  /** Acts as the caller: RLS and the has_* helpers apply. */
  user: SupabaseClient;
  /** Service role: bypasses RLS. Use only after the guard passed. */
  admin: SupabaseClient;
}

const env = (name: string): string => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing ${name}`);
  return v;
};

export const adminClient = (): SupabaseClient =>
  createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });

function decodeClaims(jwt: string): Claims {
  try {
    const part = jwt.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
  } catch {
    throw new HttpError(401, 'unauthorized', 'Sign in to continue.');
  }
}

/**
 * Who is calling. `signed-in` accepts any valid session (the email second factor may still be pending); `admin` and
 * `cms` additionally require a verified session holding the permission, checked by the database helpers (which read
 * the tables, never the JWT's permissions claim). The gateway already verified the JWT's signature (verify_jwt).
 */
export async function guard(req: Request, need: 'signed-in' | 'admin' | 'cms'): Promise<Caller> {
  const header = req.headers.get('authorization') ?? '';
  const jwt = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!jwt) throw new HttpError(401, 'unauthorized', 'Sign in to continue.');

  const user = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await user.auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Your session has ended. Sign in again.');

  if (need !== 'signed-in') {
    const { data: ok, error: rpcErr } = need === 'admin'
      ? await user.rpc('has_permission', { p: 'admin' })
      : await user.rpc('has_any_cms');
    if (rpcErr) throw new Error('permission check failed');
    if (ok !== true) throw new HttpError(403, 'forbidden', 'Your account isn’t allowed to do that.');
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? '',
    jwt,
    claims: decodeClaims(jwt),
    user,
    admin: adminClient(),
  };
}
