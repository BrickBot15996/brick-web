/** Initials for a tile, from the email's local part: maria.popescu → MP, ana → AN. */
export function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._\-+]+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2);
  return s.toUpperCase();
}

const pad = (n: number) => String(n).padStart(2, '0');
export const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function dayStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
export function daysBetween(a: Date, b: Date) {
  return Math.round((dayStart(b) - dayStart(a)) / 86_400_000);
}

export type DayGroup = 'Today' | 'Yesterday' | 'Earlier';
export function dayGroup(iso: string, now = new Date()): DayGroup {
  const n = daysBetween(new Date(iso), now);
  return n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : 'Earlier';
}

/** "12 min", "3 h" for today; "18:42" for yesterday; "Tue 15:20" for older. */
export function relativeTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const mins = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
  if (daysBetween(d, now) <= 0) {
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)} h`;
  }
  if (daysBetween(d, now) === 1) return clock(d);
  return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${clock(d)}`;
}

/** "today 14:05", "yesterday 18:42", "Tue 15:20", "12 Nov 15:20". */
export function publishedWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const n = daysBetween(d, now);
  if (n <= 0) return `today ${clock(d)}`;
  if (n === 1) return `yesterday ${clock(d)}`;
  if (n < 7) return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${clock(d)}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${clock(d)}`;
}

export function elapsed(sec: number) {
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}

/** "12 min ago", "3 h ago" for today, otherwise "yesterday 18:42", "Tue 15:20", "12 Nov 15:20". */
export function editedWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (daysBetween(d, now) <= 0) {
    const mins = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
    if (mins < 1) return 'just now';
    return mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} h ago`;
  }
  return publishedWhen(iso, now);
}

/** Valid when empty (the field is optional) or an http(s) address. */
export function isUrl(s: string): boolean {
  if (!s.trim()) return true;
  try { return ['http:', 'https:'].includes(new URL(s.trim()).protocol); } catch { return false; }
}
