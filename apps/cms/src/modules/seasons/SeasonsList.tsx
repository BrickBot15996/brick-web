import { useMemo, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useSeasonRecords } from './data/hooks';
import { AppLink } from '../../components/AppLink';
import { EditorEmpty, ListPane, MasterDetail, Thumb } from '../../components/edit';
import type { ListState } from '../../components/edit';
import { Tag } from '../../components/Tag';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function SeasonsLayout() {
  const q = useSeasonRecords();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith('/seasons/') ? decodeURIComponent(pathname.slice('/seasons/'.length).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const all = q.data ?? [];
  const shown = useMemo(() => {
    const n = norm(query.trim());
    return n ? all.filter((s) => norm(`${s.game} ${s.years} ${s.id}`).includes(n)) : all;
  }, [all, query]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';

  return (
    <MasterDetail base="/seasons" list={
      <ListPane
        title="Seasons"
        count={`${shown.length} ${shown.length === 1 ? 'season' : 'seasons'}`}
        search={{ value: query, onChange: setQuery, label: 'Search seasons' }}
        action={null}
        state={state}
        empty={{ title: 'No seasons yet.', body: 'Seasons appear here once they are added.' }}
        noResults={`No season matches “${query.trim()}”.`}
        onRetry={() => void q.refetch()}
      >
        {shown.map((s) => (
          <li key={s.id}>
            <AppLink href={`/seasons/${s.id}`} className="lrow" aria-current={selected === s.id ? 'page' : undefined}>
              <Thumb src={s.gameLogo} />
              <span className="lrow__text">
                <span className="lrow__name">{s.game}</span>
                <span className="lrow__meta">{s.years}</span>
              </span>
              {s.current && <Tag lit>Current</Tag>}
            </AppLink>
          </li>
        ))}
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function SeasonsIndex() {
  return <EditorEmpty text="Pick a season to edit its game, files, events and results." action={null} />;
}
