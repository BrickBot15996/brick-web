import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useReorderProjects, projectKeys } from './data/hooks';
import type { Project } from './data/types';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { EditorEmpty, ListPane, ListRow, MasterDetail, Thumb } from '../../components/edit';
import type { ListState } from '../../components/edit';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const host = (u: string) => { try { return new URL(u).host; } catch { return u; } };
const teamLogo = 'brand/logo.svg';

// ───────── list ─────────

export function ProjectsLayout() {
  const q = useProjects();
  const qc = useQueryClient();
  const reorder = useReorderProjects();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith('/projects/') ? decodeURIComponent(pathname.slice('/projects/'.length).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [note, setNote] = useState('');
  const focusNext = useRef<string | null>(null);

  const all = q.data ?? [];
  const shown = useMemo(() => {
    const n = norm(query.trim());
    return n ? all.filter((p) => norm(`${p.name.en} ${p.name.ro} ${p.slug}`).includes(n)) : all;
  }, [all, query]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';

  useEffect(() => {
    if (!focusNext.current) return;
    document.querySelector<HTMLElement>(`[data-act="${focusNext.current}"]:not(:disabled)`)?.focus();
    focusNext.current = null;
  });

  const move = (i: number, to: number) => {
    const ids = all.map((p) => p.id);
    const id = ids[i];
    [ids[i], ids[to]] = [ids[to], ids[i]];
    qc.setQueryData<Project[]>(projectKeys.all, (cur) => (cur ? ids.map((x, order) => ({ ...cur.find((p) => p.id === x)!, order })) : cur));
    reorder.mutate(ids);
    setNote(`${all[i].name.en} moved to position ${to + 1} of ${all.length}.`);
    const dir = to < i ? 'up' : 'down';
    focusNext.current = `${id}:${(dir === 'up' && to === 0) || (dir === 'down' && to === all.length - 1) ? (dir === 'up' ? 'down' : 'up') : dir}`;
  };

  return (
    <MasterDetail base="/projects" list={
      <ListPane
        title="Projects"
        count={`${shown.length} ${shown.length === 1 ? 'project' : 'projects'}`}
        search={{ value: query, onChange: setQuery, label: 'Search projects', disabled: ordering }}
        action={<AppLink href="/projects/new" className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
        toolbar={all.length > 1 && (
          <button type="button" className="link lp__mode" aria-pressed={ordering} onClick={() => { setOrdering(!ordering); setQuery(''); }}>
            {ordering ? 'Done' : <><Icon name="reorder" />Reorder</>}
          </button>
        )}
        state={state}
        empty={{ title: 'No projects yet.', body: 'Add the first one and it shows up in the Projects grid on the website.' }}
        noResults={`No project matches “${query.trim()}”.`}
        onRetry={() => void q.refetch()}
      >
        {(ordering ? all : shown).map((p, i) => ordering ? (
          <li key={p.id} className="lrow lrow--order">
            <Thumb src={p.logo ?? teamLogo} />
            <span className="lrow__text"><span className="lrow__name">{p.name.en}</span><span className="lrow__meta">Position {i + 1}</span></span>
            <button type="button" className="iconbtn iconbtn--sm" data-act={`${p.id}:up`} aria-label={`Move ${p.name.en} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
            <button type="button" className="iconbtn iconbtn--sm" data-act={`${p.id}:down`} aria-label={`Move ${p.name.en} down`} disabled={i === all.length - 1} onClick={() => move(i, i + 1)}><Icon name="down" /></button>
          </li>
        ) : (
          <ListRow key={p.id} href={`/projects/${p.id}`} selected={selected === p.id} thumb={<Thumb src={p.logo ?? teamLogo} />} name={p.name.en} meta={p.external ? `External · ${host(p.external)}` : `/${p.slug}`} />
        ))}
        <li className="sr-only" role="status" aria-live="polite">{note}</li>
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function ProjectsIndex() {
  return <EditorEmpty text="Pick a project to edit it, or add a new one." action={<AppLink href="/projects/new" className="btn btn--primary"><Icon name="plus" />New project</AppLink>} />;
}
