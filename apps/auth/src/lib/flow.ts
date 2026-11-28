/** The sign-in in progress (email, where to go after), kept for this tab only between the password and code steps. */
type Flow = { email: string; redirect?: string };
const KEY = 'bb-auth-flow';

export function saveFlow(flow: Flow) {
  try { sessionStorage.setItem(KEY, JSON.stringify(flow)); } catch { /* private mode: the code step asks to sign in again */ }
}
export function readFlow(): Flow | null {
  try { const v = sessionStorage.getItem(KEY); return v ? (JSON.parse(v) as Flow) : null; } catch { return null; }
}
export function clearFlow() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

/** m••••••@brickbot.ro: enough to recognise your own inbox, not enough to read out on a shared screen. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(3, Math.min(user.length - 1, 8)))}@${domain}`;
}
