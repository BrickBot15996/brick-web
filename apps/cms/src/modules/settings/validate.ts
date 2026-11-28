/** IBAN checksum (ISO 13616, mod 97). Spaces and case are ignored. */
export function ibanValid(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  if (iban.startsWith('RO') && iban.length !== 24) return false;
  const moved = iban.slice(4) + iban.slice(0, 4);
  let rem = 0;
  for (const ch of moved) {
    const v = ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}
/** "RO05 BTRL EURC RT06 9057 2901" for reading. */
export const groupIban = (raw: string) => raw.replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();

/** Romanian CIF / CUI: 2 to 10 digits, the last is a check digit (key 753217532, read from the right). */
export function cifValid(raw: string): boolean {
  const s = raw.replace(/^RO/i, '').replace(/\s+/g, '');
  if (!/^\d{2,10}$/.test(s)) return false;
  const digits = s.slice(0, -1).split('').map(Number).reverse();
  const key = [2, 3, 5, 7, 1, 2, 3, 5, 7];
  const sum = digits.reduce((n, d, i) => n + d * key[i], 0);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(s.slice(-1));
}

export const emailValid = (s: string) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s.trim());

const httpUrl = (s: string): URL | null => { try { const u = new URL(s.trim()); return ['http:', 'https:'].includes(u.protocol) ? u : null; } catch { return null; } };

/** A Google Maps embed address: https, a Google host, an /embed path or output=embed. Returns an explanation or null. */
export function mapsEmbedError(s: string): string | null {
  if (!s.trim()) return null;
  const u = httpUrl(s);
  if (!u || u.protocol !== 'https:') return 'Paste the embed address; it starts with https://.';
  if (!/(^|\.)google\.[a-z.]+$/.test(u.hostname)) return 'This is not a Google Maps address.';
  if (!(u.pathname.startsWith('/maps/embed') || u.searchParams.get('output') === 'embed')) return 'Use the embed address: on Google Maps choose Share, Embed a map, and copy the src of the iframe.';
  return null;
}

/** An "Open in Google Maps" link: google.com/maps, maps.app.goo.gl, goo.gl/maps or g.page. */
export function mapsLinkError(s: string): string | null {
  if (!s.trim()) return null;
  const u = httpUrl(s);
  if (!u || u.protocol !== 'https:') return 'Paste the link; it starts with https://.';
  const h = u.hostname;
  const ok = /(^|\.)google\.[a-z.]+$/.test(h) && u.pathname.startsWith('/maps') || h === 'maps.app.goo.gl' || (h === 'goo.gl' && u.pathname.startsWith('/maps')) || h === 'g.page' || h === 'maps.google.com';
  return ok ? null : 'This is not a Google Maps link. Use Share, then Copy link, on Google Maps.';
}

/** A social URL: https for every network, mailto: for email. */
export function socialUrlError(network: string, s: string): string | null {
  const v = s.trim();
  if (!v) return 'Enter the address.';
  if (network === 'email') return /^mailto:[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/i.test(v) ? null : 'Use mailto: followed by the email, e.g. mailto:contact@brickbot.ro.';
  const u = httpUrl(v);
  return u && u.protocol === 'https:' ? null : 'Enter a full address that starts with https://.';
}
