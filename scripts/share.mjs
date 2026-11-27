#!/usr/bin/env node
/**
 * Starts an app's dev server and a Cloudflare quick tunnel to it, and stops both on Ctrl+C.
 *   pnpm share:website     pnpm share:links
 * The tunnel prints a fresh https://*.trycloudflare.com address each run. Anyone with it can open your dev server, so stop it when you're done.
 */
import { spawn } from 'node:child_process';
import net from 'node:net';

const apps = { website: 4321, links: 4322 };
const app = process.argv[2];
const port = apps[app];
if (!port) { console.error(`Usage: node scripts/share.mjs <${Object.keys(apps).join('|')}>`); process.exit(1); }

const children = [];
const stop = (code = 0) => { for (const c of children) c.kill('SIGTERM'); process.exit(code); };
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

const run = (cmd, args, tag) => {
  const c = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(c);
  const pipe = (s, out) => s.on('data', (d) => String(d).split('\n').filter(Boolean).forEach((l) => out.write(`[${tag}] ${l}\n`)));
  pipe(c.stdout, process.stdout); pipe(c.stderr, process.stderr);
  c.on('error', (e) => { console.error(`[${tag}] ${e.message}${e.code === 'ENOENT' ? ' (is it installed?)' : ''}`); stop(1); });
  c.on('exit', (code) => { if (code) { console.error(`[${tag}] exited with ${code}`); stop(code); } });
  return c;
};

const listening = () => new Promise((resolve) => {
  const s = net.connect(port, '127.0.0.1');
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('error', () => resolve(false));
});

run('pnpm', ['--filter', `@brickbot/${app}`, 'dev'], 'dev');
for (let i = 0; i < 120 && !(await listening()); i++) await new Promise((r) => setTimeout(r, 500));
if (!(await listening())) { console.error(`The dev server never came up on port ${port}.`); stop(1); }
run('cloudflared', ['tunnel', '--url', `http://127.0.0.1:${port}`], 'tunnel');
console.log(`\nLook for the https://….trycloudflare.com address in the [tunnel] lines. Ctrl+C stops both.\n`);
