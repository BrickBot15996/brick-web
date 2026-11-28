import { ZONE } from '../../lib/dates';

const day = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short' });
const dayYear = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', year: 'numeric' });
const time = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** "14 Mar" this year, "14 Mar 2025" otherwise, in Bucharest. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = dayYear.format(d).slice(-4) === dayYear.format(new Date()).slice(-4);
  return (sameYear ? day : dayYear).format(d);
}
/** "14 Mar, 09:00" in Bucharest. */
export const shortDateTime = (iso: string) => `${shortDate(iso)}, ${time.format(new Date(iso))}`;
