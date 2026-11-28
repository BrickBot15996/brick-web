import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { usePosts, useTopics } from './data/hooks';
import { publishIssues } from './data/rules';
import type { Post, PostStatus } from './data/types';
import { shortDate, shortDateTime } from './dates';
import { useSeasons } from '../../lib/data/hooks';
import { AppLink } from '../../components/AppLink';
import { Icon } from '../../components/icons';
import { EditorEmpty, ListPane, ListRow, MasterDetail, Thumb } from '../../components/edit';
import type { ListState } from '../../components/edit';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
export const POSTS_BASE = '/blog/posts';
const STATUS_LABEL: Record<PostStatus, string> = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published' };

function meta(p: Post): string {
  const when = p.status === 'published' && p.publishedAt ? shortDate(p.publishedAt)
    : p.status === 'scheduled' && p.publishAt ? shortDateTime(p.publishAt)
    : `edited ${shortDate(p.editedAt)}`;
  const ro = publishIssues(p).ro.length > 0 ? ' · Romanian missing' : '';
  return `${STATUS_LABEL[p.status]} · ${when}${ro}`;
}

export function PostsLayout() {
  const q = usePosts();
  const seasons = useSeasons().data ?? [];
  const topics = useTopics().data ?? [];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith(`${POSTS_BASE}/`) && !pathname.endsWith('/new') ? decodeURIComponent(pathname.slice(POSTS_BASE.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [season, setSeason] = useState('all');
  const [topic, setTopic] = useState('all');
  const all = q.data ?? [];

  // Opening a post from the palette or home that the filters hide clears them.
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || seen.current === selected || !q.data) return;
    seen.current = selected;
    const p = q.data.find((x) => x.id === selected);
    if (!p) return;
    if (status !== 'all' && p.status !== status) setStatus('all');
    if (season !== 'all' && p.season !== season) setSeason('all');
    if (topic !== 'all' && !p.topics.includes(topic)) setTopic('all');
  }, [selected, q.data, status, season, topic]);

  const shown = useMemo(() => {
    const n = norm(query.trim());
    return all
      .filter((p) => (status === 'all' || p.status === status) && (season === 'all' || p.season === season) && (topic === 'all' || p.topics.includes(topic))
        && (!n || norm(`${p.title.en} ${p.title.ro} ${p.slug}`).includes(n)))
      .sort((a, b) => b.editedAt.localeCompare(a.editedAt));
  }, [all, query, status, season, topic]);
  const state: ListState = q.isPending ? 'loading' : q.isError ? 'error' : all.length === 0 ? 'empty' : shown.length === 0 ? 'noresults' : 'ready';
  const filtered = status !== 'all' || season !== 'all' || topic !== 'all' || query.trim() !== '';

  return (
    <MasterDetail base={POSTS_BASE} list={
      <ListPane
        title="Posts"
        count={`${shown.length} ${shown.length === 1 ? 'post' : 'posts'}`}
        search={{ value: query, onChange: setQuery, label: 'Search posts' }}
        action={<AppLink href={`${POSTS_BASE}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New post</AppLink>}
        filters={
          <>
            <label className="lp__filter"><span className="label">Status</span>
              <select className="input input--select input--sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="lp__filter"><span className="label">Season</span>
              <select className="input input--select input--sm" value={season} onChange={(e) => setSeason(e.target.value)}>
                <option value="all">All seasons</option>
                {seasons.map((s) => <option key={s.id} value={s.id}>{s.game} {s.years}</option>)}
              </select>
            </label>
            <label className="lp__filter"><span className="label">Topic</span>
              <select className="input input--select input--sm" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="all">All topics</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name.en}</option>)}
              </select>
            </label>
          </>
        }
        state={state}
        empty={{ title: 'No posts yet.', body: 'Write the first BrickLog post. Until one is published, the website shows its under-construction page.' }}
        noResults={filtered ? 'No post matches. Try another status, season or topic, or clear the search.' : 'No posts.'}
        onRetry={() => void q.refetch()}
      >
        {shown.map((p) => <ListRow key={p.id} href={`${POSTS_BASE}/${p.id}`} selected={selected === p.id} thumb={<Thumb src={p.cover} fit="cover" />} name={p.title.en || 'Untitled post'} meta={meta(p)} />)}
      </ListPane>
    }>
      <Outlet />
    </MasterDetail>
  );
}

export function PostsIndex() {
  return <EditorEmpty text="Pick a post to edit it, or write a new one." action={<AppLink href={`${POSTS_BASE}/new`} className="btn btn--primary"><Icon name="plus" />New post</AppLink>} />;
}
