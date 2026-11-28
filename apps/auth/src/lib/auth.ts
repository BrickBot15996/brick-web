/**
 * The auth API the screens talk to. Three implementations share one contract:
 * `live` (Supabase Auth + the `email-2fa` Edge Function, docs/backend.md §3 and §9), `preview` (in-memory, for design
 * review) and `unavailable` (a build with no Supabase config fails closed). PRODUCT.md: the email second factor is custom,
 * Supabase MFA has no email factor.
 */
import { getSupabase, getMySession } from '@brickbot/supabase';
import { AuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js';
export type AuthErrorCode =
  | 'invalid-credentials' // wrong email or password; never says which, never says whether the email is a member
  | 'wrong-code'
  | 'code-expired'
  | 'rate-limited'
  | 'link-expired'
  | 'weak-password'
  | 'session-expired' // the half-finished sign-in is gone (signed out elsewhere, or the session lapsed): start again
  | 'network';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, public retryAfter?: number) {
    super(code);
  }
}

export type SignInResult = { status: 'signed-in' } | { status: 'code-required' };
export type LinkKind = 'reset' | 'invite';

export interface AuthClient {
  /** True while running on the local preview implementation. */
  readonly preview: boolean;
  signIn(email: string, password: string): Promise<SignInResult>;
  /** Checks the emailed code; on success the browser is trusted for 30 days. */
  verifyCode(email: string, code: string): Promise<void>;
  sendCode(email: string): Promise<void>;
  requestReset(email: string): Promise<void>;
  /** Validates a reset or invite link and returns the account's email. */
  openLink(kind: LinkKind, token: string | undefined): Promise<{ email: string }>;
  setPassword(kind: LinkKind, token: string, password: string): Promise<void>;
  /** The signed-in, second-factor-verified member, or null. Drives the app launcher and "already signed in". */
  session(): Promise<{ email: string; permissions: string[] } | null>;
  signOut(): Promise<void>;
}

export const MIN_PASSWORD = 10;
export const CODE_LENGTH = 6;
export const RESEND_AFTER = 45;

const TRUST_KEY = 'bb-trusted-until';
const DAY = 86_400_000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function trusted(): boolean {
  try { return Number(localStorage.getItem(TRUST_KEY)) > Date.now(); } catch { return false; }
}
function trust() {
  try { localStorage.setItem(TRUST_KEY, String(Date.now() + 30 * DAY)); } catch { /* then the next sign-in asks again */ }
}

/**
 * Preview behaviour, for trying every state by hand:
 * password "wrong" → no match · email containing "limit" → rate limited · code 000000 → wrong · 111111 → expired ·
 * link token "expired" (or none) → expired link. Anything else succeeds. A verified code trusts this browser for 30 days.
 */
const preview: AuthClient = {
  preview: true,
  async signIn(email, password) {
    await wait(700);
    if (email.includes('limit')) throw new AuthError('rate-limited', 60);
    if (password === 'wrong') throw new AuthError('invalid-credentials');
    return trusted() ? { status: 'signed-in' } : { status: 'code-required' };
  },
  async verifyCode(_email, code) {
    await wait(600);
    if (code === '000000') throw new AuthError('wrong-code');
    if (code === '111111') throw new AuthError('code-expired');
    trust();
  },
  async sendCode() { await wait(500); },
  async requestReset() { await wait(700); },
  async openLink(_kind, token) {
    await wait(400);
    if (!token || token === 'expired') throw new AuthError('link-expired');
    return { email: 'maria.popescu@brickbot.ro' };
  },
  async setPassword(_kind, _token, password) {
    await wait(700);
    if (password.length < MIN_PASSWORD) throw new AuthError('weak-password');
    trust(); // the link already proved the inbox
  },
  async session() { return { email: 'maria.popescu@brickbot.ro', permissions: ['cms.website'] }; },
  async signOut() { await wait(200); },
};


/**
 * Live behaviour. The trusted-device token (backend.md §9, 30 days) lives in localStorage on the auth origin under
 * `bb-trusted-devices`, a JSON map `{ [email]: { token, expiresAt } }`, so several members can share one browser.
 * It is the only credential kept outside the Supabase session cookie, and it is useless without the password.
 */
const DEVICES_KEY = 'bb-trusted-devices';
type Devices = Record<string, { token: string; expiresAt: string }>;
const norm = (email: string) => email.trim().toLowerCase();

function readDevices(): Devices {
  try { return JSON.parse(localStorage.getItem(DEVICES_KEY) ?? '{}') as Devices; } catch { return {}; }
}
function deviceToken(email: string): string | undefined {
  const d = readDevices()[norm(email)];
  return d && Date.parse(d.expiresAt) > Date.now() ? d.token : undefined;
}
function saveDevice(email: string, token: string, expiresAt: string) {
  try { localStorage.setItem(DEVICES_KEY, JSON.stringify({ ...readDevices(), [norm(email)]: { token, expiresAt } })); } catch { /* the next sign-in asks for a code again */ }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

interface FnError { error?: { code?: string; retryAfter?: number } }

/** Calls `email-2fa` with the current session. Throws AuthError with the mapped code. */
async function twoFactor<T>(action: 'start' | 'send' | 'verify', args: Record<string, unknown> = {}): Promise<T> {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new AuthError('session-expired');
  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/email-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, ...args }),
    });
  } catch {
    throw new AuthError('network');
  }
  const body = (await res.json().catch(() => ({}))) as T & FnError;
  if (res.ok) return body;
  if (res.status === 401) throw new AuthError('session-expired');
  const code = body.error?.code;
  if (code === 'wrong-code' || code === 'code-expired') throw new AuthError(code);
  if (res.status === 429 || code === 'rate-limited') throw new AuthError('rate-limited', body.error?.retryAfter);
  if (code === 'deactivated' || res.status === 403) throw new AuthError('invalid-credentials');
  throw new AuthError('network');
}

/** Maps a Supabase Auth error from a password or link call. `fallback` is the code for a plain rejection. */
function mapAuth(e: unknown, fallback: AuthErrorCode): AuthError {
  if (e instanceof AuthError) return e;
  if (isAuthRetryableFetchError(e)) return new AuthError('network');
  if (e instanceof AuthApiError) {
    if (e.status === 429 || e.code === 'over_request_rate_limit' || e.code === 'over_email_send_rate_limit') return new AuthError('rate-limited', 60);
    if (e.code === 'weak_password') return new AuthError('weak-password');
    return new AuthError(fallback);
  }
  return new AuthError('network');
}

// A link token is single-use and React StrictMode runs effects twice in development, so each token is verified once.
const opened = new Map<string, Promise<{ email: string }>>();

const live: AuthClient = {
  preview: false,
  async signIn(email, password) {
    const sb = getSupabase();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw mapAuth(error, 'invalid-credentials'); // wrong password, unknown email and banned all read the same
    try {
      const res = await twoFactor<{ status: 'verified' | 'code-sent' }>('start', { deviceToken: deviceToken(email) });
      return res.status === 'verified' ? { status: 'signed-in' } : { status: 'code-required' };
    } catch (e) {
      await sb.auth.signOut({ scope: 'local' }).catch(() => undefined); // never leave a half-verified session behind
      throw e;
    }
  },
  async sendCode() {
    await twoFactor('send');
  },
  async verifyCode(email, code) {
    const { deviceToken: token, expiresAt } = await twoFactor<{ deviceToken: string; expiresAt: string }>('verify', { code });
    saveDevice(email, token, expiresAt);
  },
  async requestReset(email) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset` });
    // Same outcome whether or not the email is a member: only rate limits and network failures are reported.
    if (error && (isAuthRetryableFetchError(error) || (error instanceof AuthApiError && (error.status === 429 || error.code?.includes('rate_limit'))))) {
      throw mapAuth(error, 'network');
    }
  },
  openLink(kind, token) {
    if (!token) return Promise.reject(new AuthError('link-expired'));
    const key = `${kind}:${token}`;
    let p = opened.get(key);
    if (!p) {
      p = (async () => {
        const sb = getSupabase();
        const { data, error } = await sb.auth.verifyOtp({ type: kind === 'invite' ? 'invite' : 'recovery', token_hash: token });
        if (error || !data.session) throw mapAuth(error, 'link-expired');
        await twoFactor('start'); // the link proved the inbox: marks this session verified without a code
        return { email: data.session.user.email ?? '' };
      })();
      opened.set(key, p);
      p.catch(() => { if (opened.get(key) === p) opened.delete(key); }); // a network failure can be retried; an expired link just fails again
    }
    return p;
  },
  async setPassword(_kind, _token, password) {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) {
      if (error instanceof AuthApiError && (error.status === 401 || error.code === 'session_not_found' || error.code === 'reauthentication_needed')) throw new AuthError('link-expired');
      throw mapAuth(error, 'weak-password');
    }
  },
  async session() {
    try {
      const s = await getMySession();
      return s?.verified ? { email: s.email, permissions: s.permissions } : null;
    } catch {
      return null;
    }
  },
  async signOut() {
    // Same rule as packages/supabase signOut: the browser's session is removed even when the server revoke fails.
    const sb = getSupabase();
    const { error } = await sb.auth.signOut().catch((e: unknown) => ({ error: e as Error }));
    if (error) {
      await sb.auth.signOut({ scope: 'local' }).catch(() => undefined);
      throw error;
    }
  },
};

/** When no Supabase config is built in, a production build fails closed: nothing signs in, every call reports the server unreachable. */
const unavailable: AuthClient = {
  preview: false,
  signIn: () => Promise.reject(new AuthError('network')),
  verifyCode: () => Promise.reject(new AuthError('network')),
  sendCode: () => Promise.reject(new AuthError('network')),
  requestReset: () => Promise.reject(new AuthError('network')),
  openLink: () => Promise.reject(new AuthError('network')),
  setPassword: () => Promise.reject(new AuthError('network')),
  session: () => Promise.resolve(null),
  signOut: () => Promise.resolve(),
};

/**
 * Selection: preview when VITE_AUTH_PREVIEW is 'true' (vite.config.ts defaults it to true in `vite dev` unless AUTH_PREVIEW=false,
 * and never in a build); live when Supabase is configured; otherwise unavailable (fails closed).
 */
export const auth: AuthClient =
  import.meta.env.VITE_AUTH_PREVIEW === 'true' ? preview
  : supabaseUrl && import.meta.env.VITE_SUPABASE_ANON_KEY ? live
  : unavailable;

export function errorCode(e: unknown): AuthErrorCode {
  return e instanceof AuthError ? e.code : 'network';
}
