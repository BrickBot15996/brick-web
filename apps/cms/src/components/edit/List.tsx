import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { mediaUrl } from '../../lib/data/media';
import { PageHeader } from '../PageHeader';
import { AppLink } from '../AppLink';
import { Icon } from '../icons';

/**
 * The left half of the list → edit pattern: a list column (heading, search, filters, "New", rows) and, beside it, the
 * editor. From 1100px both show; below that the list and the editor are separate screens on the same routes.
 *
 *   <MasterDetail base="/projects" list={<ListPane …>…<ListRow …/></ListPane>}><Outlet /></MasterDetail>
 */
export function MasterDetail({ base, list, children }: { base: string; list: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const detail = pathname.replace(/\/$/, '') !== base;
  return (
    <div className="md" data-view={detail ? 'detail' : 'list'}>
      <div className="md__list">{list}</div>
      <div className="md__detail" key={pathname}>{children}</div>
    </div>
  );
}

export type ListState = 'loading' | 'error' | 'empty' | 'noresults' | 'ready';

export function ListPane({ title, count, search, filters, action, toolbar, state, empty, noResults, onRetry, children }: {
  /** Names the list for screen readers (the page header carries the module's name). */
  title: string;
  /** Shown under the module's name in the page header, e.g. "22 sponsors". */
  count?: string;
  search: { value: string; onChange: (v: string) => void; label: string; disabled?: boolean };
  filters?: ReactNode;
  /** The "New" button (an AppLink styled as .btn). */
  action: ReactNode;
  /** Extra controls beside the count, e.g. Reorder. */
  toolbar?: ReactNode;
  state: ListState;
  empty: { title: string; body: string };
  noResults: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="lp" aria-label={title}>
      <PageHeader sub={state === 'ready' || state === 'noresults' ? <span className="tnum" role="status">{count}</span> : undefined} actions={action} />
      <div className="lp__tools">
        <div className="lp__search">
          <Icon name="search" />
          <input type="search" className="input input--search" aria-label={search.label} placeholder={search.label} value={search.value} disabled={search.disabled} onChange={(e) => search.onChange(e.target.value)} />
        </div>
        {filters && <div className="lp__filters">{filters}</div>}
        {toolbar && <div className="lp__meta">{toolbar}</div>}
      </div>
      {state === 'loading' && <div className="lp__rows" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton lrow-skel" style={{ opacity: 1 - i * 0.14 }} />)}</div>}
      {state === 'error' && (
        <div className="notice" role="alert"><span>Couldn’t load the list.</span>{onRetry && <button type="button" className="link" onClick={onRetry}>Try again</button>}</div>
      )}
      {state === 'empty' && <div className="lp__empty"><p className="lp__empty-t">{empty.title}</p><p>{empty.body}</p></div>}
      {state === 'noresults' && <div className="lp__empty">{noResults}</div>}
      {state === 'ready' && <ul className="lp__rows">{children}</ul>}
    </section>
  );
}

/** A thumbnail tile: the file from the CDN on a dark or light ground, or a quiet stand-in. */
export function Thumb({ src, tile = 'dark', fit = 'contain' }: { src: string | null | undefined; tile?: 'light' | 'dark'; fit?: 'contain' | 'cover' }) {
  return (
    <span className={`thumb thumb--${tile}`} aria-hidden="true">
      {src ? <img src={mediaUrl(src, 480)} alt="" loading="lazy" style={{ objectFit: fit }} /> : <Icon name="gallery" />}
    </span>
  );
}

export function ListRow({ href, selected, thumb, name, meta }: { href: string; selected: boolean; thumb: ReactNode; name: string; meta: string }) {
  return (
    <li>
      <AppLink href={href} className="lrow" aria-current={selected ? 'page' : undefined}>
        {thumb}
        <span className="lrow__text">
          <span className="lrow__name">{name}</span>
          <span className="lrow__meta">{meta}</span>
        </span>
      </AppLink>
    </li>
  );
}

/** Shown beside the list on desktop when nothing is open. */
export function EditorEmpty({ text, action }: { text: string; action: ReactNode }) {
  return (
    <div className="ed-empty">
      <p className="ed-empty__t">{text}</p>
      {action}
    </div>
  );
}

/** The route points at an item that isn't there (deleted, or a stale link). */
export function EditorMissing({ noun, backHref, backLabel }: { noun: string; backHref: string; backLabel: string }) {
  return (
    <div className="ed-empty">
      <p className="ed-empty__t">That {noun} doesn’t exist anymore.</p>
      <p>Someone may have deleted it, or the link is old.</p>
      <AppLink href={backHref} className="link ed-empty__back"><Icon name="arrow" className="i flip" />{backLabel}</AppLink>
    </div>
  );
}

/** The editor's loading state. */
export function EditorSkeleton() {
  return (
    <div className="ed" aria-hidden="true">
      <div className="ed__head"><div className="skeleton" style={{ height: 40, width: '55%' }} /><div className="skeleton" style={{ height: 20, width: '35%' }} /></div>
      <div className="ed__body">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 76, opacity: 1 - i * 0.2 }} />)}</div>
    </div>
  );
}
