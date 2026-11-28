/**
 * SAMPLE DATA: invented changes, consistent with the activity feed seed (core lib/data/preview.ts) and with the
 * members of the users seed. Real entries come from database triggers.
 */
import { dayAt, minsAgo } from '../../../lib/data/preview-kit';
import type { AuditAction, AuditEntry, AuditRecord } from './types';

const ME = 'maria.popescu@brickbot.ro';
const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro', vlad = 'vlad.stan@brickbot.ro';
const cris = 'cristina.badea@brickbot.ro', andrei = 'andrei.munteanu@brickbot.ro', elena = 'elena.dumitru@brickbot.ro', diana = 'diana.lupu@brickbot.ro', stefan = 'stefan.neagu@brickbot.ro';

let n = 0;
const e = (at: string, actorEmail: string, table: string, action: AuditAction, item: string, before: AuditRecord | null, after: AuditRecord | null): AuditEntry =>
  ({ id: `au${++n}`, at, actorEmail, table, action, item, before, after });
const ins = (at: string, who: string, table: string, item: string, after: AuditRecord) => e(at, who, table, 'insert', item, null, after);
const del = (at: string, who: string, table: string, item: string, before: AuditRecord) => e(at, who, table, 'delete', item, before, null);
const upd = (at: string, who: string, table: string, item: string, before: AuditRecord, after: AuditRecord) => e(at, who, table, 'update', item, before, after);
const bi = (en: string, ro: string) => ({ en, ro });

const W = 'cms.website', L = 'cms.links', A = 'admin';

const raw: AuditEntry[] = [
  upd(minsAgo(12), ana, 'sponsors', 'Banca Transilvania', { name: 'Banca Transilvania', website: 'https://bancatransilvania.ro', tier: 'gold' }, { name: 'Banca Transilvania', website: 'https://www.bancatransilvania.ro', tier: 'diamond' }),
  upd(minsAgo(40), matei, 'blog_posts', 'Worlds, from the pit', { title: bi('Worlds, from the pit', ''), status: 'draft', topics: ['competition-recaps'] }, { title: bi('Worlds, from the pit', 'Mondialele, din pit'), status: 'draft', topics: ['competition-recaps', 'team-life'] }),
  ins(minsAgo(65), ioana, 'gallery_items', 'Pit crew at Bucharest Twin Cup', { caption: bi('Pit crew at Bucharest Twin Cup', 'Echipa din pit la Bucharest Twin Cup'), season: 'decode', featured: false }),
  upd(minsAgo(185), vlad, 'season_events', 'Bucharest Twin Cup', { event: 'Bucharest Twin Cup', result: 'Semifinalist' }, { event: 'Bucharest Twin Cup', result: 'Finalist' }),
  upd(dayAt(1, '18:20'), ME, 'user_permissions', 'stefan.neagu@brickbot.ro', { email: stefan, permissions: [W] }, { email: stefan, permissions: [W, A] }),
  upd(dayAt(1, '16:05'), ana, 'link_cards', 'Redirect 3.5% of your tax', { title: 'Redirect 3.5% of your tax', highlighted: false, ends_on: '' }, { title: 'Redirect 3.5% of your tax', highlighted: true, ends_on: '2027-05-24' }),
  upd(dayAt(1, '14:30'), ME, 'projects', 'BrickBot Caravan', { name: 'BrickBot Caravan', summary: bi('School visits in Focșani.', '') }, { name: 'BrickBot Caravan', summary: bi('Visits and presentations in the schools of our town.', 'Vizite și prezentări în școlile orașului nostru.') }),
  upd(dayAt(1, '11:12'), matei, 'blog_posts', 'Welcome, new recruits', { title: bi('Welcome, new recruits', 'Bun venit, recruți noi'), status: 'draft', published_at: '' }, { title: bi('Welcome, new recruits', 'Bun venit, recruți noi'), status: 'scheduled', published_at: '2026-12-01' }),
  ins(dayAt(2, '17:48'), vlad, 'sponsors', 'Unior', { name: 'Unior', website: 'https://unior.ro', tier: 'silver', season: 'decode' }),
  upd(dayAt(2, '15:10'), andrei, 'gallery_items', 'Robot inspection', { caption: bi('Robot inspection', ''), featured: false }, { caption: bi('Robot inspection', 'Inspecția robotului'), featured: true }),
  ins(dayAt(2, '10:02'), cris, 'users', 'tudor.georgescu@brickbot.ro', { email: 'tudor.georgescu@brickbot.ro', permissions: [W], banned: false }),
  upd(dayAt(3, '20:15'), ioana, 'short_urls', '/apply', { slug: 'apply', url: 'https://forms.gle/kr4LBrLzFzvTW4S18' }, { slug: 'apply', url: 'https://forms.gle/kr4LBrLzFzvTW4S19' }),
  upd(dayAt(3, '15:20'), ME, 'seasons', 'DECODE 2025–26', { name: 'DECODE', current: true, summary: bi('', '') }, { name: 'DECODE', current: true, summary: bi('Our tenth season.', 'Al zecelea sezon al nostru.') }),
  ins(dayAt(3, '12:44'), diana, 'short_urls', '/press', { slug: 'press', url: 'https://brickbot.ro/en/press' }),
  upd(dayAt(4, '19:02'), ana, 'blog_posts', 'DECODE: what we learned this season', { title: bi('DECODE: what we learned this season', 'DECODE: ce am învățat în acest sezon'), status: 'scheduled' }, { title: bi('DECODE: what we learned this season', 'DECODE: ce am învățat în acest sezon'), status: 'published' }),
  upd(dayAt(4, '16:30'), ME, 'user_permissions', 'diana.lupu@brickbot.ro', { email: diana, permissions: [L] }, { email: diana, permissions: [W, L] }),
  del(dayAt(4, '13:15'), elena, 'link_cards', 'Join the Vault', { title: 'Join the Vault', url: 'https://vault.brickbot.ro', highlighted: false }),
  upd(dayAt(5, '18:00'), vlad, 'awards', 'Think Award', { name: bi('Think Award', 'Premiul Think'), season: 'into-the-deep', rank: '2nd' }, { name: bi('Think Award', 'Premiul Think'), season: 'into-the-deep', rank: '1st' }),
  ins(dayAt(5, '11:40'), ioana, 'gallery_items', 'Caravan at the Unirea college', { caption: bi('Caravan at the Unirea college', 'Caravana la Colegiul Unirea'), season: 'decode', featured: true }),
  upd(dayAt(6, '17:25'), cris, 'users', 'alex.constantin@brickbot.ro', { email: 'alex.constantin@brickbot.ro', banned: false }, { email: 'alex.constantin@brickbot.ro', banned: true }),
  upd(dayAt(6, '9:30'), ME, 'site_settings', 'Association details', { cif: '50846996', iban: 'RO05BTRLEURCRT0690572901', address: '15 Cezar Bolliac Street, Focșani' }, { cif: '50846996', iban: 'RO05BTRLEURCRT0690572901', address: '15 Cezar Bolliac Street, Focșani, Vrancea, Romania' }),
  ins(dayAt(7, '19:12'), matei, 'blog_posts', 'From the CAD room', { title: bi('From the CAD room', ''), status: 'draft', topics: ['engineering'] }),
  upd(dayAt(7, '14:08'), andrei, 'faq_items', 'How can I join?', { question: bi('How can I join?', 'Cum mă pot alătura?'), answer: bi('Fill in the form.', 'Completează formularul.') }, { question: bi('How can I join?', 'Cum mă pot alătura?'), answer: bi('Apply with the form on the Join page.', 'Aplică prin formularul din pagina Alătură-te.') }),
  del(dayAt(8, '16:44'), vlad, 'sponsors', 'Old print shop', { name: 'Old print shop', website: 'https://example.com', tier: 'bronze' }),
  upd(dayAt(8, '12:20'), ME, 'user_permissions', 'elena.dumitru@brickbot.ro', { email: elena, permissions: [] }, { email: elena, permissions: [L] }),
  ins(dayAt(9, '18:36'), elena, 'link_cards', 'Support BrickBot through a secure donation', { title: 'Support BrickBot through a secure donation', url: 'https://brickbot.ro/en/donate', highlighted: false }),
  upd(dayAt(9, '10:15'), diana, 'short_urls', '/docs', { slug: 'docs', url: 'https://docs.brickbot.ro/' }, { slug: 'docs', url: 'https://docs.brickbot.ro' }),
  upd(dayAt(10, '17:05'), ana, 'projects', 'FIRST Steps Into STEAM', { name: 'FIRST Steps Into STEAM', summary: bi('Workshops for rural students.', 'Ateliere pentru elevi din mediul rural.') }, { name: 'FIRST Steps Into STEAM', summary: bi('Technical and non-technical workshops introducing secondary school students from rural areas to STEAM.', 'Ateliere tehnice și non-tehnice care introduc elevii de gimnaziu din mediul rural în STEAM.') }),
  ins(dayAt(10, '13:50'), ioana, 'press_assets', 'BrickBot logo, white', { name: 'BrickBot logo, white', url: 'brand/logo-white.svg' }),
  upd(dayAt(11, '19:30'), vlad, 'season_events', 'Focșani Tech Challenge', { event: 'Focșani Tech Challenge', result: 'Rank 4' }, { event: 'Focșani Tech Challenge', result: 'Rank 3' }),
  ins(dayAt(11, '11:00'), matei, 'blog_posts', 'Welcome, new recruits', { title: bi('Welcome, new recruits', ''), status: 'draft', topics: ['team-life'] }),
  upd(dayAt(12, '15:45'), cris, 'user_permissions', 'radu.tudor@brickbot.ro', { email: 'radu.tudor@brickbot.ro', permissions: [W, L] }, { email: 'radu.tudor@brickbot.ro', permissions: [L] }),
  upd(dayAt(13, '12:12'), ME, 'sponsors', 'Unior', { name: 'Unior', tier: 'silver', website: 'https://unior.ro' }, { name: 'Unior', tier: 'gold', website: 'https://unior.ro' }),
  del(dayAt(14, '17:20'), andrei, 'gallery_items', 'Blurry pit photo', { caption: bi('Blurry pit photo', ''), season: 'decode', featured: false }),
  upd(dayAt(15, '9:48'), ana, 'seasons', 'DECODE 2025–26', { name: 'DECODE', current: true, summary: bi('', '') }, { name: 'DECODE', current: true, summary: bi('', 'Al zecelea sezon') }),
  ins(dayAt(16, '16:10'), stefan, 'faq_items', 'What is FIRST?', { question: bi('What is FIRST?', 'Ce este FIRST?'), answer: bi('An international robotics organisation.', 'O organizație internațională de robotică.') }),
  upd(dayAt(17, '18:30'), ME, 'user_permissions', 'stefan.neagu@brickbot.ro', { email: stefan, permissions: [] }, { email: stefan, permissions: [W] }),
  ins(dayAt(18, '12:00'), ME, 'users', 'stefan.neagu@brickbot.ro', { email: stefan, permissions: [], banned: false }),
  upd(dayAt(19, '14:40'), vlad, 'awards', 'Control Award', { name: bi('Control Award', 'Premiul Control'), season: 'into-the-deep', rank: '' }, { name: bi('Control Award', 'Premiul Control'), season: 'into-the-deep', rank: '2nd' }),
  upd(dayAt(20, '11:25'), diana, 'link_cards', 'Join our global mentorship program', { title: 'Join our global mentorship program, BrickBot Academy!', highlighted: false }, { title: 'Join our global mentorship program, BrickBot Academy!', highlighted: true }),
  ins(dayAt(21, '17:55'), elena, 'short_urls', '/academy', { slug: 'academy', url: 'https://forms.gle/16HcqxaW3yd2SXBd7' }),
  upd(dayAt(22, '10:30'), matei, 'blog_posts', 'DECODE: what we learned this season', { title: bi('DECODE: what we learned', ''), status: 'draft' }, { title: bi('DECODE: what we learned this season', ''), status: 'draft' }),
  upd(dayAt(24, '16:20'), cris, 'user_permissions', 'maria.popescu@brickbot.ro', { email: ME, permissions: [W, L] }, { email: ME, permissions: [W, L, A] }),
  upd(dayAt(25, '13:05'), andrei, 'gallery_items', 'Team at the school gate', { caption: bi('Team at the school gate', ''), season: 'decode' }, { caption: bi('Team at the school gate', 'Echipa la poarta colegiului'), season: 'decode' }),
  del(dayAt(27, '15:34'), ioana, 'press_assets', 'Old roll-up photo', { name: 'Old roll-up photo', url: 'press/photos/roll-up.webp' }),
  ins(dayAt(28, '12:18'), vlad, 'season_events', 'SparkHope', { event: 'SparkHope', result: 'Winner' }),
  upd(dayAt(30, '18:44'), ana, 'projects', 'Brick By Brick School', { name: 'Brick By Brick School', summary: bi('Our recruit programme.', '') }, { name: 'Brick By Brick School', summary: bi('Our structured preparation programme for recruits.', 'Programul nostru structurat de pregătire pentru recruți.') }),
  ins(dayAt(32, '10:12'), ME, 'users', 'diana.lupu@brickbot.ro', { email: diana, permissions: [L], banned: false }),
  upd(dayAt(33, '16:48'), ME, 'site_settings', 'Contact', { contact_email: 'info@brickbot.ro' }, { contact_email: 'contact@brickbot.ro' }),
  ins(dayAt(35, '9:25'), ioana, 'gallery_items', 'Hackathon night', { caption: bi('Hackathon night', 'Noapte de hackathon'), season: 'decode', featured: false }),
  upd(dayAt(38, '14:10'), cris, 'user_permissions', 'andrei.munteanu@brickbot.ro', { email: andrei, permissions: [] }, { email: andrei, permissions: [W] }),
  ins(dayAt(38, '14:02'), cris, 'users', 'andrei.munteanu@brickbot.ro', { email: andrei, permissions: [], banned: false }),
  upd(dayAt(41, '17:30'), vlad, 'sponsors', 'Raiffeisen', { name: 'Raiffeisen', tier: 'bronze' }, { name: 'Raiffeisen', tier: 'silver' }),
  del(dayAt(44, '11:50'), diana, 'short_urls', '/old-form', { slug: 'old-form', url: 'https://forms.gle/old' }),
  upd(dayAt(47, '13:22'), ME, 'user_permissions', 'cristina.badea@brickbot.ro', { email: cris, permissions: [W, A] }, { email: cris, permissions: [A] }),
  ins(dayAt(50, '15:00'), matei, 'blog_posts', 'DECODE: what we learned this season', { title: bi('DECODE: what we learned', ''), status: 'draft', topics: ['competition-recaps'] }),
  upd(dayAt(54, '10:40'), ana, 'faq_items', 'What fields does the team work in?', { question: bi('What fields does the team work in?', 'În ce domenii lucrează echipa?'), answer: bi('Engineering.', 'Inginerie.') }, { question: bi('What fields does the team work in?', 'În ce domenii lucrează echipa?'), answer: bi('Engineering, programming, design and events.', 'Inginerie, programare, design și evenimente.') }),
  upd(dayAt(58, '12:35'), cris, 'users', 'alex.constantin@brickbot.ro', { email: 'alex.constantin@brickbot.ro', permissions: [W, L] }, { email: 'alex.constantin@brickbot.ro', permissions: [W] }),
  ins(dayAt(61, '18:15'), elena, 'link_cards', 'Redirect 3.5% of your tax', { title: 'Redirect 3.5% of your tax', url: 'https://formular230.ro/asociatia-brickbot', highlighted: false }),
  ins(dayAt(70, '9:00'), ME, 'users', 'cristina.badea@brickbot.ro', { email: cris, permissions: [W], banned: false }),
  ins(dayAt(75, '9:05'), ME, 'user_permissions', 'ioana.radu@brickbot.ro', { email: ioana, permissions: [W] }),
];

/** Newest first. */
export const entries: AuditEntry[] = raw.sort((a, b) => b.at.localeCompare(a.at));
