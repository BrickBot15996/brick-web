import { useMemo, useState } from 'react';
import { useEditForm } from '../lib/form';
import type { Errors } from '../lib/form';
import { formatDate, formatDateTime } from '../lib/dates';
import { AppLink } from '../components/AppLink';
import { Icon } from '../components/icons';
import {
  BilingualField, BilingualMarkdownField, DataTable, DateField, DateTimeField, FileField, NumberField, Section, SelectField, SettingsPage, TabbedModule, TabLater, TablePage,
  TagPicker, TextField, ToggleField,
} from '../components/edit';
import type { Column, ModuleTab } from '../components/edit';

/**
 * Reference page of the shared kit, development only (/_kit). Every component of components/edit/ is used here the way
 * a module would use it. Copy from this file, not from the screenshots.
 */
const TABS: ModuleTab[] = [
  { href: '/_kit/fields', label: 'Fields' },
  { href: '/_kit/table', label: 'Table' },
  { href: '/_kit/states', label: 'States' },
];

export function KitLayout() {
  return <TabbedModule label="Kit sections" tabs={TABS} />;
}

// ───────── fields, inside SettingsPage ─────────

interface Demo {
  title: { en: string; ro: string };
  body: { en: string; ro: string };
  amount: number | null;
  share: number | null;
  day: string;
  at: string;
  featured: boolean;
  current: boolean;
  topics: string[];
  season: string;
  logo: string | null;
  deck: string | null;
  clip: string | null;
  any: string | null;
}

const TOPICS = ['Competition recaps', 'Engineering', 'Programming', 'Design', 'Outreach', 'Sponsors', 'Media', 'Team life', 'Announcements'].map((t) => ({ value: t.toLowerCase().replace(/\W+/g, '-'), label: t }));

function validate(v: Demo): Errors {
  const e: Errors = {};
  if (v.amount === null) e.amount = 'Enter the amount in euros.';
  else if (v.amount < 0 || v.amount > 100000) e.amount = 'Use an amount between 0 and 100,000.';
  if (!v.day) e.day = 'Pick a date.';
  return e;
}

export function KitFields() {
  const form = useEditForm<Demo>({
    initial: {
      title: { en: 'Focșani Tech Challenge', ro: '' },
      body: { en: 'We **organise** the league meet every year.\n\n- teams from the region\n- a day of matches', ro: '' },
      amount: 1000, share: 3.5, day: '2026-05-25', at: '2026-03-14T08:00:00.000Z', featured: true, current: false,
      topics: ['engineering', 'outreach'], season: 'decode', logo: 'sponsors/unior.png', deck: null, clip: null, any: null,
    },
    validate,
    save: async () => { await new Promise((r) => setTimeout(r, 400)); },
  });
  return (
    <SettingsPage form={form} title="Field kit" edited={{ by: 'maria.popescu@brickbot.ro', at: new Date().toISOString() }}>
      <Section title="Text" note="Bilingual fields flag a missing language after the typing pause.">
        <BilingualField name="title" label="Title" softMax={60} />
        <BilingualMarkdownField name="body" label="Description" optional />
        <SelectField name="season" label="Season" options={[{ value: 'decode', label: 'DECODE 2025–26' }, { value: 'into-the-deep', label: 'INTO THE DEEP 2024–25' }]} />
        <TextField name="__unused" label="Plain text field" optional placeholder="Anything" />
      </Section>
      <Section title="Numbers and dates">
        <NumberField name="amount" label="Amount" unit="€" min={0} max={100000} step={50} integer hint="Arrow keys step by 50." />
        <NumberField name="share" label="Share" unit="%" min={0} max={100} step={0.5} optional />
        <DateField name="day" label="Deadline" hint="A calendar date, no time zone." />
        <DateTimeField name="at" label="Starts" hint="When the event begins." />
      </Section>
      <Section title="Switches and tags">
        <ToggleField name="featured" label="Featured" hint="Featured items lead the page." />
        <ToggleField name="current" label="Current season" />
        <TagPicker name="topics" label="Topics" options={TOPICS} hint="Type to filter, arrows and Enter to add, Backspace removes the last." />
      </Section>
      <Section title="Files">
        <FileField name="logo" label="Logo (image)" kind="image" folders={['sponsors/', 'brand/']} tile="dark" optional />
        <FileField name="deck" label="Sponsor deck (PDF)" kind="pdf" folders={['documents/']} optional />
        <FileField name="clip" label="Clip (video)" kind="video" folders={['gallery/']} optional />
        <FileField name="any" label="Any file" kind="any" folders={['documents/', 'gallery/', 'brand/']} optional />
      </Section>
    </SettingsPage>
  );
}

// ───────── table ─────────

interface Row { slug: string; to: string; clicks: number; created: string; updated: string }
const ROWS: Row[] = [
  { slug: 'apply', to: 'https://forms.gle/kr4LBrLzFzvTW4S18', clicks: 412, created: '2026-01-12', updated: '2026-03-04T09:30:00.000Z' },
  { slug: 'academy', to: 'https://forms.gle/16HcqxaW3yd2SXBd7', clicks: 188, created: '2026-01-12', updated: '2026-02-20T14:10:00.000Z' },
  { slug: 'submit-portfolio', to: 'https://forms.gle/YGcVdcwkANbtqKNs5', clicks: 36, created: '2026-02-02', updated: '2026-02-02T11:00:00.000Z' },
  { slug: 'formular230', to: 'https://formular230.ro/asociatia-brickbot', clicks: 1290, created: '2026-01-12', updated: '2026-05-01T08:45:00.000Z' },
  { slug: 'stripe', to: 'https://donate.stripe.com/00w6oI2wK5wBfQT0Sw5J602', clicks: 254, created: '2026-01-12', updated: '2026-01-12T10:00:00.000Z' },
  { slug: 'docs', to: 'https://docs.brickbot.ro', clicks: 97, created: '2026-01-12', updated: '2026-04-18T16:20:00.000Z' },
];

const COLS: Column<Row>[] = [
  { id: 'slug', header: 'Short URL', cell: (r) => `/${r.slug}`, sort: (a, b) => a.slug.localeCompare(b.slug), width: '14rem' },
  { id: 'to', header: 'Goes to', cell: (r) => r.to, sort: (a, b) => a.to.localeCompare(b.to) },
  { id: 'clicks', header: 'Clicks', cell: (r) => <span className="tnum">{r.clicks}</span>, sort: (a, b) => a.clicks - b.clicks, align: 'end', secondary: true },
  { id: 'created', header: 'Created', cell: (r) => formatDate(r.created), sort: (a, b) => a.created.localeCompare(b.created), secondary: true },
  { id: 'updated', header: 'Updated', cell: (r) => formatDateTime(r.updated), sort: (a, b) => a.updated.localeCompare(b.updated), secondary: true },
];

export function KitTable() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => ROWS.filter((r) => `${r.slug} ${r.to}`.includes(q.trim().toLowerCase())), [q]);
  return (
    <TablePage
      title="Short URLs"
      count={`${rows.length} ${rows.length === 1 ? 'link' : 'links'}`}
      action={<AppLink href="/_kit/table" className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
      toolbar={<div className="lp__search"><Icon name="search" /><input type="search" className="input input--search" aria-label="Search short URLs" placeholder="Search short URLs" value={q} onChange={(e) => setQ(e.target.value)} /></div>}
    >
      <DataTable<Row>
        label="Short URLs" rows={rows} columns={COLS} rowKey={(r) => r.slug} rowHref={(r) => `/_kit/table#${r.slug}`} defaultSort={{ id: 'slug', dir: 'asc' }}
        filtered={q.trim() !== ''} noResults={`No short URL matches “${q.trim()}”.`} empty={{ title: 'No short URLs yet.', body: 'Add one and brickbot.ro/<slug> starts to redirect.' }}
        actions={(r) => <button type="button" className="iconbtn iconbtn--sm" aria-label={`Delete /${r.slug}`}><Icon name="trash" /></button>}
      />
    </TablePage>
  );
}

// ───────── states ─────────

export function KitStates() {
  return (
    <div className="col col--tab">
      <h1 className="h1">States</h1>
      <div style={{ display: 'grid', gap: 28, marginTop: 28 }}>
        <section><h2 className="h2" style={{ marginBottom: 10 }}>Loading</h2><DataTable<Row> label="Loading" rows={[]} columns={COLS} rowKey={(r) => r.slug} loading empty={{ title: '' }} /></section>
        <section><h2 className="h2" style={{ marginBottom: 10 }}>Empty</h2><DataTable<Row> label="Empty" rows={[]} columns={COLS} rowKey={(r) => r.slug} empty={{ title: 'No short URLs yet.', body: 'Add one and brickbot.ro/<slug> starts to redirect.', action: <AppLink href="/_kit/states" className="btn btn--primary btn--sm"><Icon name="plus" />New short URL</AppLink> }} /></section>
        <section><h2 className="h2" style={{ marginBottom: 10 }}>Error</h2><DataTable<Row> label="Error" rows={[]} columns={COLS} rowKey={(r) => r.slug} error onRetry={() => {}} empty={{ title: '' }} /></section>
      </div>
      <TabLater name="A tab not built yet" blurb="What it will hold." ready={TABS[0]} />
    </div>
  );
}
