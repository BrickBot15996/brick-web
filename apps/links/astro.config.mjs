// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Every app reads the root .env (CLAUDE.md §10); browser-safe values are mapped to PUBLIC_ here.
const rootEnv = new URL('../../.env', import.meta.url);
const env = { ...(existsSync(rootEnv) ? parseEnv(readFileSync(rootEnv, 'utf8')) : {}), ...process.env };

// Vite's dev and preview servers send public files with `no-cache`, so every page navigation re-checks the font and the
// text paints before it arrives. Serve the fonts with the same long cache as production (public/_headers).
/** @type {import('vite').Connect.NextHandleFunction} */
const serveFonts = (req, res, next) => {
  const m = req.url?.match(/^\/fonts\/([\w-]+\.woff2)(?:\?.*)?$/);
  if (!m) return next();
  try {
    const buf = readFileSync(new URL(`./public/fonts/${m[1]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': 'font/woff2', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=31536000, immutable' });
    res.end(buf);
  } catch { next(); }
};
/** @type {import('vite').Plugin} */
const cachedFonts = { name: 'cached-fonts', configureServer: (s) => { s.middlewares.use(serveFonts); }, configurePreviewServer: (s) => { s.middlewares.use(serveFonts); } };

export default defineConfig({
  site: env.LINKS_URL || 'https://links.brickbot.ro',
  output: 'static',
  build: { format: 'directory' },
  vite: {
    plugins: [cachedFonts],
    server: { allowedHosts: ['.trycloudflare.com'] },
    preview: { allowedHosts: ['.trycloudflare.com'] },
    define: {
      'import.meta.env.PUBLIC_CDN_URL': JSON.stringify(env.CDN_URL || 'https://cdn.brickbot.ro'),
      // Until the owner uploads docs/cdn-manifest.md, media is served from public/preview at the same keys.
      'import.meta.env.PUBLIC_CDN_PREVIEW': JSON.stringify(env.CDN_PREVIEW ?? 'true'),
    },
  },
});
