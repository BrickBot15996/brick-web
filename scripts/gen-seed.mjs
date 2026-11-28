#!/usr/bin/env node
/**
 * Generates supabase/seed.sql: the real starting content of the CMS database (docs/backend.md §8 "Content").
 *
 *   node scripts/gen-seed.mjs            # writes supabase/seed.sql
 *   node scripts/gen-seed.mjs --stdout   # prints it
 *
 * Sources, in priority order:
 *   1. apps/website/src/lib/*.ts (seasons, sponsors, projects, gallery, blog topics, copy), bundled with esbuild and imported
 *   2. literals inside the website's page components (About, Team, Join, Partners, Press), read from the .astro files
 *   3. CLAUDE.md (short URLs §3.12, linktree §4, tiers §3.8, association §3.8) and docs/legacy-content (sponsor tiers)
 * Nothing here is sample data. Every row has a deterministic id, so re-running the seed is harmless (on conflict do nothing).
 * created_by / updated_by stay null: no users exist when the seed runs.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lib = join(root, 'apps/website/src/lib');
const pages = join(root, 'apps/website/src/components/pages');

// ───────────────────────── load the website's data modules ─────────────────────────

function findEsbuild() {
  const pnpm = join(root, 'node_modules/.pnpm');
  const dir = readdirSync(pnpm).filter((d) => /^esbuild@\d/.test(d)).sort().pop();
  if (!dir) throw new Error('esbuild not found: run pnpm install');
  return createRequire(join(pnpm, dir, 'node_modules/esbuild/'))(join(pnpm, dir, 'node_modules/esbuild'));
}

async function loadWebsite() {
  const esbuild = findEsbuild();
  const tmp = mkdtempSync(join(tmpdir(), 'brickbot-seed-'));
  try {
    const entry = join(tmp, 'entry.ts');
    writeFileSync(entry, [
      `export { seasons } from ${JSON.stringify(join(lib, 'seasons.ts'))};`,
      `export { sponsors } from ${JSON.stringify(join(lib, 'sponsors.ts'))};`,
      `export { projects } from ${JSON.stringify(join(lib, 'projects.ts'))};`,
      `export { gallery } from ${JSON.stringify(join(lib, 'gallery.ts'))};`,
      `export { topics } from ${JSON.stringify(join(lib, 'blog.ts'))};`,
      `export { copy } from ${JSON.stringify(join(lib, 'copy.ts'))};`,
    ].join('\n'));
    const out = join(tmp, 'out.mjs');
    await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: out, define: { 'import.meta.env': '{}' }, logLevel: 'silent' });
    return await import(pathToFileURL(out).href);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// ───────────────────────── read literals out of .astro components ─────────────────────────

const read = (file) => readFileSync(join(pages, file), 'utf8');

/** Index of the bracket that closes the one at `open`, skipping strings and template literals. */
function closing(src, open) {
  const pair = { '[': ']', '{': '}' };
  const stack = [pair[src[open]]];
  for (let i = open + 1; i < src.length; i++) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      for (i++; src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === '[' || c === '{') stack.push(pair[c]);
    else if (c === stack[stack.length - 1]) { stack.pop(); if (!stack.length) return i; }
  }
  throw new Error('unbalanced literal');
}
const evaluate = (src) => new Function(`return (${src})`)();
/** The literal that follows `marker` (e.g. "const milestones = "). */
function literal(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  const open = at + marker.length;
  return evaluate(src.slice(open, closing(src, open) + 1));
}
/** Every array that follows `key: ` (once per language, in file order: en then ro). */
function arrays(src, key) {
  const out = [];
  for (let at = src.indexOf(`${key}: [`); at >= 0; at = src.indexOf(`${key}: [`, at + 1)) {
    const open = src.indexOf('[', at);
    out.push(evaluate(src.slice(open, closing(src, open) + 1)));
  }
  if (out.length !== 2) throw new Error(`expected 2 "${key}" arrays, found ${out.length}`);
  return out;
}
/** Every string that follows `key: ` (en then ro). */
function strings(src, key) {
  const out = [];
  const re = new RegExp(`(?<![A-Za-z])${key}: ('(?:[^'\\\\\\n]|\\\\.)*'|\`[^\`]*\`)`, 'g');
  for (const m of src.matchAll(re)) out.push(evaluate(m[1]));
  if (out.length !== 2) throw new Error(`expected 2 "${key}" strings, found ${out.length}`);
  return out;
}

// ───────────────────────── SQL helpers ─────────────────────────

const clean = (s) => String(s).replace(/⁠/g, '');
const q = (v) => (v === null || v === undefined ? 'null' : `'${clean(v).replace(/'/g, "''")}'`);
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
const bi = (en, ro) => j({ en, ro });
const num = (v) => (v === null || v === undefined ? 'null' : String(v));
const bool = (v) => (v ? 'true' : 'false');
/** Stable uuid from a string, so ids survive regeneration. */
const uid = (s) => { const h = createHash('md5').update(s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`; };
const slugify = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const out = [];
const counts = {};
function insert(table, cols, rows, conflict = '(id)') {
  if (!rows.length) return;
  counts[table] = (counts[table] ?? 0) + rows.length;
  out.push(`-- ${table}: ${rows.length}`);
  out.push(`insert into public.${table} (${cols.join(', ')}) values`);
  out.push(rows.map((r) => `  (${r.join(', ')})`).join(',\n'));
  out.push(`on conflict ${conflict} do nothing;\n`);
}

// ───────────────────────── gather ─────────────────────────

const site = await loadWebsite();
const { seasons, sponsors, projects, gallery, topics, copy } = site;

const aboutSrc = read('About.astro');
const teamSrc = read('Team.astro');
const joinSrc = read('Join.astro');
const partnersSrc = read('Partners.astro');
const pressSrc = read('Press.astro');

// Seasons ────────────────────────────────────────────────────────────────────────────
const years = (s) => clean(s.years);
const seasonRows = seasons.map((s) => [
  q(s.slug), q(s.name), q(years(s)), num(s.ftc ?? null), bool(s.current),
  'null', q(s.teamPhoto?.key ?? null), q(s.robot?.key ?? null), q(s.onshape ?? ''),
  // Portfolio fields hold CDN keys; the legacy values were URLs into the obsolete bucket (CLAUDE.md §9/§11), so start empty.
  'null', 'null',
]);

// Awards: always manual. `at` is the FTC event code. The type is read off the award's name where it names one.
const awardType = (en) => {
  const m = en.match(/^(Inspire|Think|Connect|Innovate|Control|Motivate|Design|Promote|Compass) Award/);
  if (m) return m[1];
  if (/^Dean’s List$/.test(en)) return 'Dean’s List';
  if (/finalist alliance/i.test(en)) return 'Finalist alliance';
  if (/^Winners$/.test(en) || /winning alliance/i.test(en)) return 'Winning alliance';
  if (/^\d+(st|nd|rd|th) place$/.test(en)) return 'Placement';
  return null;
};
const awardRows = [];
const extraRows = [];
for (const s of seasons) {
  s.awards.forEach((a, i) => {
    awardRows.push([q(uid(`award:${s.slug}:${i}`)), q(s.slug), bi(a.award.en, a.award.ro), bi(a.event.en, a.event.ro), q(a.at ?? null), 'null', q(awardType(a.award.en))]);
  });
  (s.extraEvents ?? []).forEach((e) => {
    extraRows.push([q(uid(`extra:${s.slug}:${e.name.en}`)), q(s.slug), bi(e.name.en, e.name.ro), q(e.date), bi(e.place.en, e.place.ro), q(''), bi(e.result.en, e.result.ro)]);
  });
}

// Tiers (legacy values, CLAUDE.md §3.8; Romanian names from the Partners page) and benefits ───────────
const tiers = literal(partnersSrc, 'const tiers = ');
const benefitsByLang = literal(partnersSrc, 'const benefits = ');
const tierRows = tiers.map((t, i) => [q(t.name.en.toLowerCase()), bi(t.name.en, t.name.ro), num(t.from), num(t.n), num(i)]);
const benefitRows = benefitsByLang.en.map((en, i) => [q(uid(`benefit:${i}`)), bi(en, benefitsByLang.ro[i]), num(i)]);

// Sponsors: names, logos and links from the website; tiers from docs/legacy-content/data/sponsor-data.tsx.
const legacySponsors = readFileSync(join(root, 'docs/legacy-content/data/sponsor-data.tsx'), 'utf8');
const legacyTier = {};
for (const m of legacySponsors.matchAll(/name: "([^"]+)",[\s\S]*?tier: (\w+),/g)) legacyTier[m[1]] = m[2].toLowerCase();
const sponsorRows = sponsors.map((s) => {
  const tier = legacyTier[s.name];
  if (!tier) throw new Error(`no tier for sponsor ${s.name}`);
  const id = s.logo.replace(/^sponsors\//, '').replace(/\.[a-z]+$/, '');
  return [q(id), q(s.name), q(s.logo), q(s.href ?? ''), q('decode'), q(tier)];
});

// Projects ──────────────────────────────────────────────────────────────────────────
const projectRows = projects.map((p, i) => [
  q(p.id), q(p.slug), bi(p.name.en, p.name.ro), bi(p.summary.en, p.summary.ro), q(p.logo), q(p.external ?? null),
  j(p.stats ?? []), j(p.body ?? { en: [], ro: [] }), j(p.facts ?? []), j(p.photos ?? []), j(p.partners ?? []), num(i),
]);

// Blog topics ─────────────────────────────────────────────────────────────────────────
const topicRows = topics.map((t, i) => [q(t.id), q(t.id), bi(t.label.en, t.label.ro), num(i)]);

// Gallery ─────────────────────────────────────────────────────────────────────────────
const galleryRows = gallery.map((g) => [
  q(uid(`gallery:${g.key}`)), q('photo'), q(g.key), 'null', num(g.width), num(g.height), q(g.season ?? null),
  g.date ? q(`${g.date}${g.date.length === 7 ? '-01' : ''}`) : 'null', bool(g.featured),
  bi(g.alt.en, g.alt.ro), bi(g.caption?.en ?? '', g.caption?.ro ?? ''),
]);

// Team & story ────────────────────────────────────────────────────────────────────────
const milestones = literal(aboutSrc, 'const milestones = ');
const milestoneRows = milestones.map((m) => [q(`${m.when}-${slugify(m.en[0])}`), q(m.when), bi(m.en[0], m.ro[0]), bi(m.en[1], m.ro[1]), 'null']);

const [ledeEn, ledeRo] = strings(teamSrc, 'lede');
const [driveEn, driveRo] = strings(teamSrc, 'driveLede');
const [doEn, doRo] = strings(teamSrc, 'doLede');
const [valuesEn, valuesRo] = arrays(teamSrc, 'values');
const [doesEn, doesRo] = arrays(teamSrc, 'does');
const bullets = (a) => a.map((x) => `- ${x}`).join('\n');
const teamRow = [
  '1', bi(driveEn, driveRo), bi(ledeEn, ledeRo),
  j(valuesEn.map((v, i) => ({ name: { en: v.t, ro: valuesRo[i].t }, line: { en: v.d, ro: valuesRo[i].d } }))),
  bi(`${doEn}\n\n${bullets(doesEn)}`, `${doRo}\n\n${bullets(doesRo)}`),
  q('seasons/biobuzz/team-photo.webp'),
];

// The numbers are entered by hand in the CMS (CLAUDE.md §3.1): they start empty.
const impactRows = [
  ['years', 'Years active', 'Ani de activitate'], ['awards', 'Awards won', 'Premii câștigate'],
  ['reached', 'People reached', 'Persoane atinse'], ['events', 'Outreach events', 'Evenimente de impact'],
].map(([id, en, ro], i) => [q(id), 'null', q(''), bi(en, ro), num(i)]);

// Join ────────────────────────────────────────────────────────────────────────────────
const [deptsEn, deptsRo] = arrays(joinSrc, 'depts');
const [reqEn, reqRo] = arrays(joinSrc, 'req');
const deptIds = ['assembly-3d-design', 'programming', 'events', 'social-media', 'graphic-design', 'photo-video', 'fundraising'];
if (deptsEn.length !== deptIds.length) throw new Error('department count changed');
const deptRows = deptIds.map((id, i) => [q(id), bi(deptsEn[i].t, deptsRo[i].t), bi(deptsEn[i].d, deptsRo[i].d), j([]), num(i)]);
const joinRow = ['1', bi(bullets(reqEn), bullets(reqRo))];

// Support documents: "how a sponsorship works" from the Partners page ───────────────────────
const [howEn, howRo] = arrays(partnersSrc, 'how');
const steps = (a) => a.map((s, i) => `${i + 1}. **${s.t}.** ${s.d}`).join('\n');
const supportDocsRow = ['1', 'null', bi(steps(howEn), steps(howRo))];

// Home & FAQ ──────────────────────────────────────────────────────────────────────────
const heroRow = [
  '1', bi(`${copy.en.hero.mottoA} ${copy.en.hero.mottoB}`.replace(/^./, (c) => c.toUpperCase()), `${copy.ro.hero.mottoA} ${copy.ro.hero.mottoB}`),
  bi(copy.en.intro.body, copy.ro.intro.body), q('image'), q('site/home/hero.webp'), 'null',
];
const faqRows = copy.en.faq.items.map((it, i) => [q(uid(`faq:${i}`)), bi(it.q, copy.ro.faq.items[i].q), bi(it.a, copy.ro.faq.items[i].a), num(i)]);
// Form 230 runs from the start of the year until 25 May (CLAUDE.md §3.8). The window is dated for the next one.
const form230Row = [
  '1', q('2027-01-01'), q('2027-05-25'),
  bi('Redirect 3.5% of your income tax to BrickBot with Form 230, until 25 May.', 'Redirecționează 3,5% din impozitul pe venit către BrickBot prin Formularul 230, până pe 25 mai.'),
  q('https://formular230.ro/asociatia-brickbot'),
];

// Press kit ───────────────────────────────────────────────────────────────────────────
const press = literal(pressSrc, 'const descriptions = ');
const pressPhotos = literal(pressSrc, 'const photos = ');
const pressKind = (key) => (/practice-field|robot/.test(key) ? 'robot' : 'team');
const pressRow = [
  '1',
  j({
    logoSvgDark: 'brand/logo.svg', logoSvgLight: 'brand/logo-black.svg', logoPngDark: null, logoPngLight: null,
    wordmarkSvgDark: 'brand/wordmark.svg', wordmarkSvgLight: 'brand/wordmark-black.svg', wordmarkPngDark: null, wordmarkPngLight: null,
  }),
  j(pressPhotos.map((p) => ({ id: slugify(p.key.replace(/\.webp$/, '').replace(/\//g, '-')), kind: pressKind(p.key), file: p.key, alt: { en: clean(p.en), ro: clean(p.ro) } }))),
  bi(press.short.en, press.short.ro), bi(press.long.en, press.long.ro), q('contact@brickbot.ro'),
];

// Site settings (CLAUDE.md §3.9, §3.11, §3.8 Donate, §4) ──────────────────────────────────
const MAPS_Q = 'Strada%20Cezar%20Bolliac%2015%2C%20Foc%C8%99ani%2C%20Romania';
const settingsRow = [
  '1', q('contact@brickbot.ro'),
  bi('15 Cezar Bolliac Street, Focșani, Vrancea, Romania', 'Str. Cezar Bolliac nr. 15, Focșani, Vrancea, România'),
  q(`https://www.google.com/maps?q=${MAPS_Q}&output=embed`), q(`https://www.google.com/maps/search/?api=1&query=${MAPS_Q}`),
  q('Asociația BrickBot'), q('50846996'), q('Banca Transilvania'), bi('Focșani branch', 'Sucursala Focșani'), q('RO05BTRLEURCRT0690572901'),
];
const socials = [
  ['website', 'https://brickbot.ro/en'], ['instagram', 'https://instagram.com/brickbotcnu'], ['facebook', 'https://facebook.com/brickbotcnu'],
  ['tiktok', 'https://tiktok.com/@brickbotcnu'], ['linkedin', 'https://linkedin.com/company/brickbot'], ['email', 'mailto:contact@brickbot.ro'],
  ['youtube', 'https://youtube.com/channel/UCRpA5UNXSZDl2GmPt_E91ew'], ['github', 'https://github.com/BrickBot15996'],
];
const socialRows = socials.map(([n, u], i) => [q(n), q(u), num(i)]);

// Linktree (CLAUDE.md §4) and short URLs (§3.12) ─────────────────────────────────────────
const cards = [
  ['Join our global mentorship program, BrickBot Academy!', 'brickbot.ro/academy', 'https://brickbot.ro/academy', null, true, null, null],
  ['Support BrickBot through a secure online donation!', 'brickbot.ro/en/donate', 'https://brickbot.ro/en/donate', null, false, null, null],
  // Visible from the start of the year until 24 May (the legacy cutoff); dated for the next window.
  ['Redirect 3.5% of your income tax to help BrickBot!', 'brickbot.ro/formular230', 'https://brickbot.ro/formular230', 'links/icons/form-230.svg', false, '2027-01-01', '2027-05-24'],
];
const cardRows = cards.map(([t, d, u, icon, hl, s, e], i) => [q(uid(`card:${i}`)), q(t), q(d), q(u), q(icon), bool(hl), q(s), q(e), num(i)]);
const shorts = [
  ['apply', 'https://forms.gle/kr4LBrLzFzvTW4S18'], ['academy', 'https://forms.gle/16HcqxaW3yd2SXBd7'],
  ['submit-portfolio', 'https://forms.gle/YGcVdcwkANbtqKNs5'], ['formular230', 'https://formular230.ro/asociatia-brickbot'],
  ['stripe', 'https://donate.stripe.com/00w6oI2wK5wBfQT0Sw5J602'], ['docs', 'https://docs.brickbot.ro'],
];
const shortRows = shorts.map(([s, u]) => [q(s), q(u)]);

// ───────────────────────── emit (parents before children) ─────────────────────────

insert('seasons', ['id', 'game', 'years', 'ftc', 'current', 'game_logo', 'team_photo', 'robot', 'onshape', 'portfolio_pdf', 'portfolio_cover'], seasonRows);
insert('season_events', ['id', 'season_id', 'name', 'date', 'place', 'place_url', 'result'], extraRows);
insert('awards', ['id', 'season_id', 'name', 'event', 'event_code', 'extra_id', 'type'], awardRows);
insert('projects', ['id', 'slug', 'name', 'summary', 'logo', 'external', 'stats', 'body', 'facts', 'photos', 'partners', 'sort'], projectRows);
insert('blog_topics', ['id', 'slug', 'name', 'sort'], topicRows);
insert('timeline_milestones', ['id', 'occurred_on', 'title', 'text', 'image'], milestoneRows);
insert('team_page', ['id', 'mission', 'drive', '"values"', 'students_do', 'team_photo'], [teamRow]);
insert('impact_numbers', ['id', 'value', 'suffix', 'label', 'sort'], impactRows);
insert('join_page', ['id', 'requirements'], [joinRow]);
insert('departments', ['id', 'name', 'description', 'photos', 'sort'], deptRows);
insert('gallery_items', ['id', 'kind', 'key', 'youtube_id', 'width', 'height', 'season_id', 'date', 'featured', 'alt', 'caption'], galleryRows);
insert('sponsor_tiers', ['id', 'name', 'amount', 'benefits', 'sort'], tierRows);
insert('sponsor_benefits', ['id', 'text', 'sort'], benefitRows);
insert('sponsors', ['id', 'name', 'logo', 'website', 'season_id', 'tier_id'], sponsorRows);
insert('support_docs', ['id', 'contract', 'contract_text'], [supportDocsRow]);
insert('home_hero', ['id', 'tagline', 'intro', 'media_type', 'media', 'poster'], [heroRow]);
insert('faq_items', ['id', 'question', 'answer', 'sort'], faqRows);
insert('form230_callout', ['id', 'starts_on', 'ends_on', 'text', 'link'], [form230Row]);
insert('press_kit', ['id', 'marks', 'photos', 'short_description', 'long_description', 'contact_email'], [pressRow]);
insert('site_settings', ['id', 'email', 'address', 'maps_embed', 'maps_link', 'association_name', 'cif', 'bank', 'branch', 'iban'], [settingsRow]);
insert('social_links', ['network', 'url', 'sort'], socialRows, '(network)');
insert('link_cards', ['id', 'title', 'display_url', 'url', 'icon', 'highlighted', 'starts_on', 'ends_on', 'sort'], cardRows);
insert('short_urls', ['slug', 'url'], shortRows, '(slug)');

const header = `-- Real starting content for the CMS database. GENERATED by scripts/gen-seed.mjs: edit the sources, not this file.
-- Sources: apps/website/src/lib/*, the website's page components, CLAUDE.md, docs/legacy-content (see the script's header).
-- Idempotent: every insert is "on conflict do nothing". created_by / updated_by stay null (no users exist yet).
--
-- The audit triggers are switched off while seeding, so the seed does not show up as "changes waiting" to publish
-- or as audit rows: it is the starting state, not an edit.

do $$
declare t text;
begin
  for t in select distinct table_name from public.publish_tables loop
    execute format('alter table public.%I disable trigger trg_audit', t);
  end loop;
end $$;

`;
const footer = `do $$
declare t text;
begin
  for t in select distinct table_name from public.publish_tables loop
    execute format('alter table public.%I enable trigger trg_audit', t);
  end loop;
end $$;
`;
const sql = header + out.join('\n') + '\n' + footer;

if (process.argv.includes('--stdout')) process.stdout.write(sql);
else {
  writeFileSync(join(root, 'supabase/seed.sql'), sql);
  console.error('supabase/seed.sql written:');
  for (const [t, n] of Object.entries(counts)) console.error(`  ${t.padEnd(22)} ${n}`);
}
