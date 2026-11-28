import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { blogKeys, usePosts, useReorderTopics, useTopics } from './data/hooks';
import type { Topic } from './data/types';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { EditorEmpty, ListPane, ListRow, MasterDetail } from '../../components/edit';
import type { ListState } from '../../components/edit';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
export const TOPICS_BASE = '/blog/topics';

/** How many posts carry each topic id. */
export function useTopicCounts(): Record<string, number> {
  const posts = usePosts().data ?? [];
  return useMemo(() => {
    const n: Record<string, number> = {};
    for (const p of posts) for (const t of p.topics) n[t] = (n[t] ?? 0) + 1;
    return n;
  }, [posts]);
}
export const countLabel = (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`;

export function TopicsLayout() {
  const q = useTopics();
  const counts = useTopicCounts();
  const qc = useQueryClient();
  const reorder = useReorderTopics();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith(`${TOPICS_BASE}/`) && !pathname.endsWith('/new') ? decodeURIComponent(pathname.slice(TOPICS_BASE.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [note, setNote] = useState('');
  const focusNext = useRef<string | null>(null);
  const all = q.data ?? [];

  const shown = useMemo(() => {
    const n = norm(query.trim());
    return n ? all.filter((t) => norm(`${t.name.en} ${t.name.ro} ${t.slug}`).includes(n)) : all;
  }, [all, query]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';

  useEffect(() => {
    if (!focusNext.current) return;
    document.querySelector<HTMLElement>(`[data-act="${focusNext.current}"]:not(:disabled)`)?.focus();
    focusNext.current = null;
  });

  const move = (i: number, to: number) => {
    const ids = all.map((t) => t.id);
    const id = ids[i];
    [ids[i], ids[to]] = [ids[to], ids[i]];
    qc.setQueryData<Topic[]>(blogKeys.topics, (cur) => (cur ? ids.map((x, order) => ({ ...cur.find((t) => t.id === x)!, order })) : cur));
    reorder.mutate(ids);
    setNote(`${all[i].name.en} moved to position ${to + 1} of ${all.length}.`);
    const dir = to < i ? 'up' : 'down';
    focusNext.current = `${id}:${(dir === 'up' && to === 0) || (dir === 'down' && to === all.length - 1) ? (dir === 'up' ? 'down' : 'up') : dir}`;
  };

  return (
    <MasterDetail base={TOPICS_BASE} list={
      <ListPane
        title="Topics"
        count={`${shown.length} ${shown.length === 1 ? 'topic' : 'topics'}`}
        search={{ value: query, onChange: setQuery, label: 'Search topics', disabled: ordering }}
        action={<AppLink href={`${TOPICS_BASE}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
        toolbar={all.length > 1 && (
          <button type="button" className="link lp__mode" aria-pressed={ordering} onClick={() => { setOrdering(!ordering); setQuery(''); }}>
            {ordering ? 'Done' : <><Icon name="reorder" />Reorder</>}
          </button>
        )}
        state={state}
        empty={{ title: 'No topics yet.', body: 'Posts need at least one topic to go live. Add the first one.' }}
        noResults={`No topic matches “${query.trim()}”.`}
        onRetry={() => void q.refetch()}
      >
        {(ordering ? all : shown).map((t, i) => ordering ? (
          <li key={t.id} className="lrow lrow--order">
            <span className="lrow__text"><span className="lrow__name">{t.name.en}</span><span className="lrow__meta">Position {i + 1} · {countLabel(counts[t.id] ?? 0)}</span></span>
            <button type="button" className="iconbtn iconbtn--sm" data-act={`${t.id}:up`} aria-label={`Move ${t.name.en} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
            <button type="button" className="iconbtn iconbtn--sm" data-act={`${t.id}:down`} aria-label={`Move ${t.name.en} down`} disabled={i === all.length - 1} onClick={() => move(i, i + 1)}><Icon name="down" /></button>
          </li>
        ) : (
          <ListRow key={t.id} href={`${TOPICS_BASE}/${t.id}`} selected={selected === t.id} thumb={<span className="thumb thumb--dark blog-tpos tnum" aria-hidden="true">{t.order + 1}</span>} name={t.name.en} meta={`${t.name.ro || 'No Romanian'} · ${countLabel(counts[t.id] ?? 0)}`} />
        ))}
        <li className="sr-only" role="status" aria-live="polite">{note}</li>
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function TopicsIndex() {
  return <EditorEmpty text="Pick a topic to edit it, or add a new one." action={<AppLink href={`${TOPICS_BASE}/new`} className="btn btn--primary"><Icon name="plus" />New topic</AppLink>} />;
}
