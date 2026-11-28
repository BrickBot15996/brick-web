/** YouTube links: validate a pasted URL and derive the video id and its thumbnail. */
const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be']);

/** The video id in a watch, short, embed, shorts or live link (or a bare 11-character id); null if it isn't a YouTube video. */
export function parseYouTube(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (ID.test(s)) return s;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  if (!HOSTS.has(u.hostname.toLowerCase())) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  const id = u.hostname === 'youtu.be' ? parts[0] : u.searchParams.get('v') ?? (['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] : undefined);
  return id && ID.test(id) ? id : null;
}
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
