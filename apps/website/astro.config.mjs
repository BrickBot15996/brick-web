// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync, renameSync, rmdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Every app reads the root .env (CLAUDE.md §10); browser-safe values are mapped to PUBLIC_ here.
const rootEnv = new URL('../../.env', import.meta.url);
const env = { ...(existsSync(rootEnv) ? parseEnv(readFileSync(rootEnv, 'utf8')) : {}), ...process.env };
// Build-time secrets (never mapped to PUBLIC_) are read from process.env by server-side code, e.g. src/lib/ftcevents.ts.
for (const k of ['FTC_EVENTS_USERNAME', 'FTC_EVENTS_TOKEN']) if (env[k] && !process.env[k]) process.env[k] = env[k];

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
  site: env.SITE_URL || 'https://brickbot.ro',
  output: 'static',
  build: { format: 'directory' },
  integrations: [{
    // Cloudflare serves the nearest `404.html` up the path, so /ro/anything gets the Romanian one.
    // Directory format would emit `ro/404/index.html`, which that lookup never finds.
    name: 'localized-404',
    hooks: {
      'astro:build:done': ({ dir }) => {
        for (const l of ['en', 'ro']) {
          const d = fileURLToPath(new URL(`${l}/404/`, dir));
          if (existsSync(`${d}index.html`)) { renameSync(`${d}index.html`, fileURLToPath(new URL(`${l}/404.html`, dir))); rmdirSync(d); }
        }
      },
    },
  }],
  vite: {
    plugins: [cachedFonts],
    // Lets `pnpm tunnel` (Cloudflare quick tunnel) reach the dev and preview servers.
    server: { allowedHosts: ['.trycloudflare.com'] },
    preview: { allowedHosts: ['.trycloudflare.com'] },
    define: {
      'import.meta.env.PUBLIC_CDN_URL': JSON.stringify(env.CDN_URL || 'https://cdn.brickbot.ro'),
      // Until the owner uploads docs/cdn-manifest.md, media is served from public/preview at the same keys.
      'import.meta.env.PUBLIC_CDN_PREVIEW': JSON.stringify(env.CDN_PREVIEW ?? 'true'),
      'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
      // Cloudflare's always-pass test key until the owner sets the real one (SETUP.md "Turnstile").
      'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA'),
      'import.meta.env.PUBLIC_MAPS_EMBED_URL': JSON.stringify(env.GOOGLE_MAPS_EMBED_URL || ''),
      'import.meta.env.PUBLIC_MAPS_LINK_URL': JSON.stringify(env.GOOGLE_MAPS_LINK_URL || ''),
    },
  },
});
