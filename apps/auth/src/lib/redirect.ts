const CMS = import.meta.env.VITE_CMS_URL;

/**
 * Where to send a member after signing in. Only https pages on brickbot.ro or its subdomains are accepted
 * (plus localhost in development), so `?redirect=` can never bounce a fresh session to someone else's site.
 */
export function safeRedirect(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return CMS;
  try {
    const url = new URL(raw);
    const host = url.hostname;
    const ours = url.protocol === 'https:' && (host === 'brickbot.ro' || host.endsWith('.brickbot.ro'));
    const local = import.meta.env.DEV && (host === 'localhost' || host === '127.0.0.1');
    return ours || local ? url.href : CMS;
  } catch {
    return CMS;
  }
}

export function hostOf(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}
