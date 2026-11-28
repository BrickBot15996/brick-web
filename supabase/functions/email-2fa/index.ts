// Email second factor (docs/backend.md §3, §9). Any signed-in user may call it; it is what turns a password session
// into a verified one (a row in verified_sessions), which is what is_member() checks.
import { handle, HttpError, bad } from '../_shared/http.ts';
import { guard, type Caller } from '../_shared/guard.ts';
import { hashCode, hashDeviceToken, randomCode, randomToken, safeEqual } from '../_shared/crypto.ts';
import { codeMail, sendMail } from '../_shared/email.ts';

const RESEND_AFTER_S = 45; // matches RESEND_AFTER in apps/auth/src/lib/auth.ts
const MAX_CODES_PER_HOUR = 5;
const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const DEVICE_DAYS = 30;
/** `amr` methods Supabase Auth records for sessions that began with a link or code from the member's inbox. */
const INBOX_METHODS = ['invite', 'recovery', 'otp', 'magiclink'];

const MS = { min: 60_000, hour: 3_600_000, day: 86_400_000 };
const iso = (t: number) => new Date(t).toISOString();

type CodeRow = { id: string; created_at: string; expires_at: string; attempts: number };

const sessionId = (c: Caller): string => {
  if (!c.claims.session_id) throw new HttpError(401, 'unauthorized', 'Your session has ended. Sign in again.');
  return c.claims.session_id;
};

/** The member must be active. Returns members.email, the address fixed at invite time: codes go only there, never to
 *  the (changeable) email of the Auth user or the JWT. */
async function requireActiveMember(c: Caller): Promise<string> {
  const { data, error } = await c.admin.from('members').select('deactivated_at, email').eq('user_id', c.userId).maybeSingle();
  if (error) throw new Error('member lookup failed');
  if (!data || data.deactivated_at) throw new HttpError(403, 'deactivated', 'This account is turned off. Ask an admin if that is a mistake.');
  return data.email as string;
}

async function markVerified(c: Caller, method: 'code' | 'trusted-device' | 'link') {
  const { error } = await c.admin.from('verified_sessions')
    .upsert({ session_id: sessionId(c), user_id: c.userId, method }, { onConflict: 'session_id', ignoreDuplicates: true });
  if (error) throw new Error('could not mark session verified');
}

async function isVerified(c: Caller): Promise<boolean> {
  const { data, error } = await c.admin.from('verified_sessions').select('session_id').eq('session_id', sessionId(c)).maybeSingle();
  if (error) throw new Error('verified lookup failed');
  return !!data;
}

/** Sends a fresh code unless one went out less than 45 s ago (`quietIfRecent`) or the hourly cap is reached. */
async function issueCode(c: Caller, to: string, quietIfRecent: boolean): Promise<void> {
  const now = Date.now();
  const { data: recent, error } = await c.admin.from('email_codes')
    .select('id, created_at, expires_at, attempts')
    .eq('user_id', c.userId).gte('created_at', iso(now - MS.hour)).order('created_at', { ascending: false });
  if (error) throw new Error('code lookup failed');
  const rows = (recent ?? []) as CodeRow[];

  if (rows.length) {
    const age = (now - Date.parse(rows[0].created_at)) / 1000;
    if (age < RESEND_AFTER_S) {
      if (quietIfRecent) return;
      throw new HttpError(429, 'rate-limited', 'A code was just sent. Wait a moment before asking for another.', Math.ceil(RESEND_AFTER_S - age));
    }
  }
  if (rows.length >= MAX_CODES_PER_HOUR) {
    const frees = Date.parse(rows[MAX_CODES_PER_HOUR - 1].created_at) + MS.hour;
    throw new HttpError(429, 'rate-limited', 'Too many codes were requested. Try again later.', Math.max(1, Math.ceil((frees - now) / 1000)));
  }

  const code = randomCode();
  // The older codes stop working: only the newest is ever accepted.
  await c.admin.from('email_codes').update({ consumed_at: iso(now) }).eq('user_id', c.userId).is('consumed_at', null);
  const { data: row, error: insErr } = await c.admin.from('email_codes').insert({
    user_id: c.userId,
    session_id: sessionId(c),
    code_hash: await hashCode(c.userId, code),
    expires_at: iso(now + CODE_TTL_MIN * MS.min),
  }).select('id').single();
  if (insErr || !row) throw new Error('could not store code');

  try {
    await sendMail(codeMail(to, code, CODE_TTL_MIN));
  } catch (e) {
    await c.admin.from('email_codes').delete().eq('id', row.id);
    throw e;
  }
  // Housekeeping: codes older than a day are of no use.
  await c.admin.from('email_codes').delete().eq('user_id', c.userId).lt('created_at', iso(now - MS.day));
}

async function start(c: Caller, to: string, body: Record<string, unknown>) {
  if (await isVerified(c)) return { status: 'verified' };
  if (c.claims.amr?.some((a) => INBOX_METHODS.includes(a.method))) {
    await markVerified(c, 'link');
    return { status: 'verified' };
  }
  const token = body.deviceToken;
  if (typeof token === 'string' && token.length >= 20 && token.length <= 200) {
    const hash = await hashDeviceToken(token);
    const { data } = await c.admin.from('trusted_devices').select('id, user_id, expires_at').eq('token_hash', hash).maybeSingle();
    if (data && data.user_id === c.userId && Date.parse(data.expires_at) > Date.now()) {
      await c.admin.from('trusted_devices').update({ last_used_at: iso(Date.now()) }).eq('id', data.id);
      await markVerified(c, 'trusted-device');
      return { status: 'verified' };
    }
  }
  await issueCode(c, to, true);
  return { status: 'code-sent' };
}

async function send(c: Caller, to: string) {
  if (await isVerified(c)) return { status: 'verified' };
  await issueCode(c, to, false);
  return { status: 'code-sent' };
}

async function verify(c: Caller, body: Record<string, unknown>) {
  const code = body.code;
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new HttpError(400, 'wrong-code', 'Enter the 6-digit code from the email.');

  const { data: row, error } = await c.admin.from('email_codes')
    .select('id, code_hash, expires_at, attempts')
    .eq('user_id', c.userId).is('consumed_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('code lookup failed');
  const expired = new HttpError(400, 'code-expired', 'This code has expired. Ask for a new one.');
  if (!row || Date.parse(row.expires_at) <= Date.now() || row.attempts >= MAX_ATTEMPTS) throw expired;

  // Count the attempt first, so parallel guesses can't exceed the limit.
  const { data: counted } = await c.admin.from('email_codes')
    .update({ attempts: row.attempts + 1 }).eq('id', row.id).eq('attempts', row.attempts).select('attempts').maybeSingle();
  if (!counted) throw new HttpError(429, 'rate-limited', 'Too many tries at once. Wait a moment and try again.', 2);

  if (!safeEqual(await hashCode(c.userId, code), row.code_hash)) {
    if (counted.attempts >= MAX_ATTEMPTS) throw expired;
    throw new HttpError(400, 'wrong-code', 'That code isn’t right. Check the email and try again.');
  }

  const { data: used } = await c.admin.from('email_codes')
    .update({ consumed_at: iso(Date.now()) }).eq('id', row.id).is('consumed_at', null).select('id').maybeSingle();
  if (!used) throw expired;

  await markVerified(c, 'code');
  const deviceToken = randomToken();
  const expiresAt = iso(Date.now() + DEVICE_DAYS * MS.day);
  const { error: devErr } = await c.admin.from('trusted_devices')
    .insert({ user_id: c.userId, token_hash: await hashDeviceToken(deviceToken), expires_at: expiresAt });
  if (devErr) throw new Error('could not store device');
  await c.admin.from('trusted_devices').delete().eq('user_id', c.userId).lt('expires_at', iso(Date.now()));
  return { deviceToken, expiresAt };
}

Deno.serve(handle(async (req, body) => {
  const c = await guard(req, 'signed-in');
  const to = await requireActiveMember(c);
  switch (body.action) {
    case 'start': return start(c, to, body);
    case 'send': return send(c, to);
    case 'verify': return verify(c, body);
    default: throw bad('Unknown action.');
  }
}));
