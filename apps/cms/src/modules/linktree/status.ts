import { ZONE } from '../../lib/dates';
import type { CardStatus, LinkCard } from './data/types';

/** Today as "YYYY-MM-DD" in Bucharest, the day the dates are read in. */
export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Visible now, not yet (starts later) or no longer (ended before today). Both dates are inclusive; empty means open. */
export function cardStatus(c: Pick<LinkCard, 'start' | 'end'>, today = todayKey()): CardStatus {
  if (c.start && today < c.start) return 'scheduled';
  if (c.end && today > c.end) return 'expired';
  return 'visible';
}

/** What the links page shows without the protocol: "https://brickbot.ro/en/donate" → "brickbot.ro/en/donate". */
export function displayOf(c: Pick<LinkCard, 'display' | 'href'>): string {
  return c.display.trim() || c.href.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}
