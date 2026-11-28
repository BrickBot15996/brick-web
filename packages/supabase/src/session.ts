import { getSupabase } from './client';
import { signOutEverywhere } from './signout';

export interface MySession {
  email: string;
  permissions: string[];
  /** True once the browser has passed the emailed 2FA code (or is a trusted device). */
  verified: boolean;
}

/** The caller's session summary via rpc `my_session`; null when nobody is signed in. */
export async function getMySession(): Promise<MySession | null> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getSession();
  if (!auth.session) return null;
  const { data, error } = await sb.rpc('my_session');
  if (error) throw error;
  return (data as MySession | null) ?? null;
}

export const signOut = (): Promise<void> => signOutEverywhere(getSupabase());
