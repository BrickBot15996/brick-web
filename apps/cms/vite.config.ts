import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const origin = (u: string | undefined): string => { try { return u ? new URL(u).origin : ''; } catch { return ''; } };

/**
 * Writes dist/_headers for Cloudflare Workers static assets (the URLs come from env, so it is generated, not static).
 * The CSP allows only what this app loads: its own files, the CDN (images, video), Supabase (REST, Auth, functions) and the R2 upload endpoint.
 * Build only: `vite dev` needs inline scripts for hot reload and is never served with these headers.
 */
function securityHeaders(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'brickbot-security-headers',
    apply: 'build',
    generateBundle() {
      const cdn = origin(env.CDN_URL || 'https://cdn.brickbot.ro');
      const supabase = origin(env.SUPABASE_URL);
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: ${cdn} https://i.ytimg.com`,
        `media-src 'self' blob: ${cdn}`,
        "font-src 'self'",
        `connect-src 'self' ${supabase} https://*.r2.cloudflarestorage.com`.replace(/\s+/g, ' ').trim(),
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; ');
      const source = [
        '/fonts/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/*',
        '  X-Robots-Tag: noindex',
        '  X-Frame-Options: DENY',
        `  Content-Security-Policy: ${csp}`,
        '  X-Content-Type-Options: nosniff',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
        '',
      ].join('\n');
      this.emitFile({ type: 'asset', fileName: '_headers', source });
    },
  };
}


// Every app reads the root .env (CLAUDE.md §10). Only [public] values are mapped to the browser here.
export default defineConfig(({ mode, command }) => {
  const env = { ...loadEnv(mode, new URL('../../', import.meta.url).pathname, ''), ...process.env };
  const pub = (v: string | undefined, fallback = '') => JSON.stringify(v ?? fallback);
  // `vite dev` talks to the local Supabase stack (`supabase start`) when SUPABASE_DEV_* are set, and to local sibling apps.
  const dev = command === 'serve';
  const supabaseUrl = dev && env.SUPABASE_DEV_URL && env.SUPABASE_DEV_ANON_KEY ? env.SUPABASE_DEV_URL : env.SUPABASE_URL;
  const supabaseKey = dev && env.SUPABASE_DEV_URL && env.SUPABASE_DEV_ANON_KEY ? env.SUPABASE_DEV_ANON_KEY : env.SUPABASE_ANON_KEY;
  const authUrl = dev ? 'http://127.0.0.1:5174' : env.AUTH_URL;
  return {
    plugins: [react(), tailwindcss(), securityHeaders(env)],
    envDir: false,
    build: {
      rollupOptions: {
        output: {
          // Vendor code is split by library family so the app chunk stays small and each library caches on its own.
          // Lazy route chunks (the modules) are left to Rollup's own splitting.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:@supabase|@brickbot[\\/]supabase)[\\/]/.test(id) || id.includes('/iso-url/') || id.includes('/tslib/')) return 'supabase';
            if (/[\\/](?:@tiptap|prosemirror-[a-z-]+|orderedmap|rope-sequence|w3c-keyname|linkifyjs|markdown-it|entities|mdurl|uc\.micro|linkify-it|punycode\.js|crelt)[\\/]/.test(id)) return 'tiptap';
            if (/[\\/]@tanstack[\\/]/.test(id)) return 'tanstack';
            if (/[\\/](?:react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
            return undefined;
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': pub(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': pub(supabaseKey),
      'import.meta.env.VITE_CDN_URL': pub(env.CDN_URL, 'https://cdn.brickbot.ro'),
      // Until the owner uploads docs/cdn-manifest.md, media is served from public/preview at the same keys.
      'import.meta.env.VITE_CDN_PREVIEW': pub(env.CDN_PREVIEW, 'true'),
      'import.meta.env.VITE_AUTH_URL': pub(authUrl, 'https://auth.brickbot.ro'),
      'import.meta.env.VITE_WEBSITE_URL': pub(env.SITE_URL, 'https://brickbot.ro'),
      'import.meta.env.VITE_LINKS_URL': pub(env.LINKS_URL, 'https://links.brickbot.ro'),
      // Off unless explicitly set, except under `vite dev`: a preview build runs on in-memory sample data with a fake member.
      'import.meta.env.VITE_CMS_PREVIEW': pub(env.CMS_PREVIEW || undefined, command === 'serve' ? 'true' : 'false'),
    },
  };
});
