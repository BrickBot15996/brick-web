/**
 * Dates in the CMS. The team works in Romania, so every date and time an editor sees or types is Europe/Bucharest,
 * whatever the browser's own zone is. Date-only values are plain "YYYY-MM-DD" strings (no zone). Date-times are ISO
 * strings in UTC ("2026-03-14T08:00:00.000Z"): what is stored never depends on where the editor sits.
 */
export const ZONE = 'Europe/Bucharest';

const parts = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Wall-clock fields in Bucharest for an instant. */
function wall(ms: number) {
  const p = Object.fromEntries(parts.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** ISO instant → "YYYY-MM-DDTHH:mm" for a datetime-local input, read in Bucharest. '' for an empty or bad value. */
export function isoToInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const w = wall(ms);
  const z = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${z(w.y, 4)}-${z(w.mo)}-${z(w.d)}T${z(w.h)}:${z(w.mi)}`;
}

/** "YYYY-MM-DDTHH:mm" typed as Bucharest wall-clock → ISO instant (UTC). '' stays ''. */
export function inputToIso(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return '';
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi);
  // Find the instant whose Bucharest wall clock reads `target`: start from it as if UTC, then correct by the zone's offset (twice, for DST edges).
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const w = wall(guess);
    guess += target - Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi);
  }
  return new Date(guess).toISOString();
}

/** "14 Mar 2026" from "YYYY-MM-DD" (a date, no zone). */
export function formatDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

/** "14 Mar 2026, 10:00" for an ISO instant, in Bucharest. */
export function formatDateTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)).replace(',', ',');
}
