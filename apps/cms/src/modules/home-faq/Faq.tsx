import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useParams, useRouter, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { BilingualField, BilingualMarkdownField, EditorEmpty, EditorFrame, EditorMissing, EditorSkeleton, ListPane, ListRow, MasterDetail, Section } from '../../components/edit';
import type { ListState } from '../../components/edit';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { homeFaqKeys, useCreateFaq, useDeleteFaq, useFaq, useReorderFaq, useUpdateFaq } from './data/hooks';
import type { Faq, FaqInput } from './data/types';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const WEBSITE = import.meta.env.VITE_WEBSITE_URL;
const base = '/home-faq/faq';

// ───────── list ─────────

export function FaqLayout() {
  const q = useFaq();
  const qc = useQueryClient();
  const reorder = useReorderFaq();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith(`${base}/`) ? decodeURIComponent(pathname.slice(base.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [note, setNote] = useState('');
  const focusNext = useRef<string | null>(null);

  const all = q.data ?? [];
  const shown = useMemo(() => {
    const n = norm(query.trim());
    return n ? all.filter((x) => norm(`${x.question.en} ${x.question.ro}`).includes(n)) : all;
  }, [all, query]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';

  useEffect(() => {
    if (!focusNext.current) return;
    document.querySelector<HTMLElement>(`[data-act="${focusNext.current}"]:not(:disabled)`)?.focus();
    focusNext.current = null;
  });

  const move = (i: number, to: number) => {
    const ids = all.map((x) => x.id);
    const id = ids[i];
    [ids[i], ids[to]] = [ids[to], ids[i]];
    qc.setQueryData<Faq[]>(homeFaqKeys.faq, (cur) => (cur ? ids.map((x, order) => ({ ...cur.find((p) => p.id === x)!, order })) : cur));
    reorder.mutate(ids);
    setNote(`Question moved to position ${to + 1} of ${all.length}.`);
    const dir = to < i ? 'up' : 'down';
    focusNext.current = `${id}:${(dir === 'up' && to === 0) || (dir === 'down' && to === all.length - 1) ? (dir === 'up' ? 'down' : 'up') : dir}`;
  };

  return (
    <MasterDetail base={base} list={
      <ListPane
        title="Questions"
        count={`${shown.length} ${shown.length === 1 ? 'question' : 'questions'}`}
        search={{ value: query, onChange: setQuery, label: 'Search questions', disabled: ordering }}
        action={<AppLink href={`${base}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
        toolbar={all.length > 1 && (
          <button type="button" className="link lp__mode" aria-pressed={ordering} onClick={() => { setOrdering(!ordering); setQuery(''); }}>
            {ordering ? 'Done' : <><Icon name="reorder" />Reorder</>}
          </button>
        )}
        state={state}
        empty={{ title: 'No questions yet.', body: 'Add the first one and it shows in the FAQ on the website.' }}
        noResults={`No question matches “${query.trim()}”.`}
        onRetry={() => void q.refetch()}
      >
        {(ordering ? all : shown).map((x, i) => ordering ? (
          <li key={x.id} className="lrow lrow--order">
            <span className="lrow__text"><span className="lrow__name">{x.question.en}</span><span className="lrow__meta">Position {i + 1}</span></span>
            <button type="button" className="iconbtn iconbtn--sm" data-act={`${x.id}:up`} aria-label={`Move “${x.question.en}” up`} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
            <button type="button" className="iconbtn iconbtn--sm" data-act={`${x.id}:down`} aria-label={`Move “${x.question.en}” down`} disabled={i === all.length - 1} onClick={() => move(i, i + 1)}><Icon name="down" /></button>
          </li>
        ) : (
          <ListRow key={x.id} href={`${base}/${x.id}`} selected={selected === x.id} thumb={<span className="hf-num" aria-hidden="true">{x.order + 1}</span>} name={x.question.en} meta={x.question.ro || 'No Romanian yet'} />
        ))}
        <li className="sr-only" role="status" aria-live="polite">{note}</li>
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function FaqIndex() {
  return <EditorEmpty text="Pick a question to edit it, or add a new one." action={<AppLink href={`${base}/new`} className="btn btn--primary"><Icon name="plus" />New question</AppLink>} />;
}

// ───────── editor ─────────

interface FaqForm { question: { en: string; ro: string }; answer: { en: string; ro: string } }
const toForm = (x?: Faq): FaqForm => (x ? { question: { ...x.question }, answer: { ...x.answer } } : { question: { en: '', ro: '' }, answer: { en: '', ro: '' } });
const fromForm = (f: FaqForm): FaqInput => ({
  question: { en: f.question.en.trim(), ro: f.question.ro.trim() },
  answer: { en: f.answer.en.trim(), ro: f.answer.ro.trim() },
});
function validate(f: FaqForm): Errors {
  const e: Errors = {};
  if (!f.question.en.trim()) e['question.en'] = 'Write the question.';
  if (!f.answer.en.trim()) e['answer.en'] = 'Write the answer.';
  return e;
}

export function FaqEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useFaq();
  if (q.isPending) return <EditorSkeleton />;
  const x = q.data?.find((y) => y.id === id);
  if (!x) return <EditorMissing noun="question" backHref={base} backLabel="All questions" />;
  return <FaqEditor key={x.id} item={x} />;
}
export function FaqNew() {
  return <FaqEditor key="new" />;
}

function FaqEditor({ item }: { item?: Faq }) {
  const router = useRouter();
  const create = useCreateFaq();
  const update = useUpdateFaq();
  const del = useDeleteFaq();
  const form = useEditForm<FaqForm>({
    initial: toForm(item),
    validate,
    save: (v) => (item ? update.mutateAsync({ id: item.id, input: fromForm(v) }) : create.mutateAsync(fromForm(v))),
    onSaved: (res) => { if (!item) router.history.replace(`${base}/${(res as Faq).id}`); },
  });
  return (
    <EditorFrame
      form={form}
      title={item ? item.question.en : 'New question'}
      edited={item ? { by: item.editedBy, at: item.editedAt } : null}
      back={{ href: base, label: 'All questions' }}
      viewHref={item ? `${WEBSITE}/en` : undefined}
      remove={item ? { noun: 'question', run: () => del.mutateAsync(item.id), then: base } : undefined}
    >
      <Section title="Question">
        <BilingualField name="question" label="Question" multiline />
      </Section>
      <Section title="Answer" note="New questions go to the end of the list. Use Reorder in the list to move them.">
        <BilingualMarkdownField name="answer" label="Answer" />
      </Section>
    </EditorFrame>
  );
}
