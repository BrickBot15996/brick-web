import type { APIRoute } from 'astro';
import { routes } from '../lib/site';
import { seasons } from '../lib/seasons';
import { posts } from '../lib/blog';
import { projectPages } from '../lib/projects';
/** One <url> per page with its hreflang alternates (CLAUDE.md §3). */
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://brickbot.ro');
  const abs = (p: string) => new URL(p, base).href;
  const pairs: { en: string; ro: string }[] = [
    ...Object.values(routes),
    ...seasons.map((s) => ({ en: `${routes.seasons.en}${s.slug}/`, ro: `${routes.seasons.ro}${s.slug}/` })),
    ...projectPages.map((p) => ({ en: `${routes.projects.en}${p.slug}/`, ro: `${routes.projects.ro}${p.slug}/` })),
    ...posts.filter((p) => !p.sample).map((p) => ({ en: `${routes.blog.en}${p.slug.en}/`, ro: `${routes.blog.ro}${p.slug.ro}/` })),
  ];
  const alt = (p: { en: string; ro: string }) =>
    `<xhtml:link rel="alternate" hreflang="en" href="${abs(p.en)}"/><xhtml:link rel="alternate" hreflang="ro" href="${abs(p.ro)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${abs(p.en)}"/>`;
  const urls = pairs.flatMap((p) => [p.en, p.ro].map((loc) => `<url><loc>${abs(loc)}</loc>${alt(p)}</url>`)).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
