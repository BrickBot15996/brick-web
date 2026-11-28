import { useMemo, useState } from 'react';
import { Outlet, useParams, useRouter, useRouterState } from '@tanstack/react-router';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { BilingualField, BilingualMarkdownField, EditorEmpty, EditorFrame, EditorMissing, EditorSkeleton, ImageField, ListPane, ListRow, MasterDetail, Section, TextField, Thumb } from '../../components/edit';
import type { ListState } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { useCreateMilestone, useDeleteMilestone, useMilestones, useUpdateMilestone } from './data/hooks';
import type { Milestone, MilestoneInput } from './data/types';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const WHEN = /^(\d{4})(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2024-08" → "Aug 2024"; "2016" → "2016". */
function showWhen(w: string): string {
  const [y, m, d] = w.split('-');
  return m ? `${d ? `${Number(d)} ` : ''}${MONTHS[Number(m) - 1]} ${y}` : y;
}

// ───────── list ─────────

export function TimelineLayout() {
  const q = useMilestones();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = '/team/timeline';
  const selected = pathname.startsWith(`${base}/`) ? decodeURIComponent(pathname.slice(base.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const all = q.data ?? [];
  const shown = useMemo(() => {
    const n = norm(query.trim());
    return n ? all.filter((m) => norm(`${m.title.en} ${m.title.ro} ${m.when}`).includes(n)) : all;
  }, [all, query]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';
  return (
    <MasterDetail base={base} list={
      <ListPane
        title="Milestones"
        count={`${shown.length} ${shown.length === 1 ? 'milestone' : 'milestones'}, oldest first`}
        search={{ value: query, onChange: setQuery, label: 'Search milestones' }}
        action={<AppLink href={`${base}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
        state={state}
        empty={{ title: 'No milestones yet.', body: 'Add the first one and it appears on the Our Story timeline.' }}
        noResults={`No milestone matches “${query.trim()}”.`}
        onRetry={() => void q.refetch()}
      >
        {shown.map((m) => (
          <ListRow key={m.id} href={`${base}/${m.id}`} selected={selected === m.id} thumb={<Thumb src={m.image} fit="cover" />} name={m.title.en} meta={showWhen(m.when)} />
        ))}
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function TimelineIndex() {
  return <EditorEmpty text="Pick a milestone to edit it, or add a new one." action={<AppLink href="/team/timeline/new" className="btn btn--primary"><Icon name="plus" />New milestone</AppLink>} />;
}

// ───────── editor ─────────

interface MilestoneForm { when: string; title: { en: string; ro: string }; text: { en: string; ro: string }; image: string | null }

function toForm(m?: Milestone): MilestoneForm {
  return m ? { when: m.when, title: { ...m.title }, text: { ...m.text }, image: m.image } : { when: '', title: { en: '', ro: '' }, text: { en: '', ro: '' }, image: null };
}
function fromForm(f: MilestoneForm): MilestoneInput {
  return { when: f.when.trim(), title: { en: f.title.en.trim(), ro: f.title.ro.trim() }, text: { en: f.text.en.trim(), ro: f.text.ro.trim() }, image: f.image };
}
function validate(f: MilestoneForm): Errors {
  const e: Errors = {};
  const w = f.when.trim();
  if (!w) e.when = 'Say when it happened.';
  else if (!WHEN.test(w)) e.when = 'Use a year (2016), a month (2024-08) or a day (2024-08-17).';
  if (!f.title.en.trim()) e['title.en'] = 'Give the milestone a title.';
  if (!f.text.en.trim()) e['text.en'] = 'Add a sentence or two about it.';
  return e;
}

export function MilestoneEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useMilestones();
  if (q.isPending) return <EditorSkeleton />;
  const m = q.data?.find((x) => x.id === id);
  if (!m) return <EditorMissing noun="milestone" backHref="/team/timeline" backLabel="All milestones" />;
  return <MilestoneEditor key={m.id} milestone={m} />;
}
export function MilestoneNew() {
  return <MilestoneEditor key="new" />;
}

function MilestoneEditor({ milestone }: { milestone?: Milestone }) {
  const router = useRouter();
  const create = useCreateMilestone();
  const update = useUpdateMilestone();
  const del = useDeleteMilestone();
  const form = useEditForm<MilestoneForm>({
    initial: toForm(milestone),
    validate,
    save: (v) => (milestone ? update.mutateAsync({ id: milestone.id, input: fromForm(v) }) : create.mutateAsync(fromForm(v))),
    onSaved: (res) => { if (!milestone) router.history.replace(`/team/timeline/${(res as Milestone).id}`); },
  });
  return (
    <EditorFrame
      form={form}
      title={milestone ? milestone.title.en : 'New milestone'}
      edited={milestone ? { by: milestone.editedBy, at: milestone.editedAt } : null}
      back={{ href: '/team/timeline', label: 'All milestones' }}
      viewHref={milestone ? `${WEBSITE}/en/about` : undefined}
      remove={milestone ? { noun: 'milestone', run: () => del.mutateAsync(milestone.id), then: '/team/timeline' } : undefined}
    >
      <Section title="When and what">
        <TextField name="when" label="When" placeholder="2024-08" hint="A year, a year and month, or a full date. The timeline is ordered by it." />
        <BilingualField name="title" label="Title" softMax={60} />
        <BilingualMarkdownField name="text" label="Text" />
      </Section>
      <Section title="Image" note="One photo for this milestone, shown beside it on the timeline.">
        <ImageField name="image" label="Image" optional tile="dark" folders={['site/story/timeline/']} />
      </Section>
    </EditorFrame>
  );
}
