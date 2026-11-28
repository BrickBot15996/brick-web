/** "2026-03-01" as "Mar 2026" (the website shows month and year). */
export function dateLabel(d: string): string {
  const [y, m] = d.split('-').map(Number);
  if (!y || !m) return d;
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
