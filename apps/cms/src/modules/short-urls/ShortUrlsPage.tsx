import { useMemo, useState } from 'react';
import { Outlet, useParams, useRouter, useRouterState } from '@tanstack/react-router';
import { useCreateShortUrl, useDeleteShortUrl, useShortUrls, useUpdateShortUrl } from './data/hooks';
import type { ShortUrl } from './data/types';
import { AppLink } from '../../components/AppLink';
import { Callout, DataTable, Dialog, TablePage, TextField } from '../../components/edit';
import type { Column } from '../../components/edit';
import { Icon } from '../../components/icons';
import { formatDateTime } from '../../lib/dates';
import type { Errors } from '../../lib/form';
import { FieldError, FormContext, useEditForm } from '../../lib/form';
import { useShell } from '../../lib/shell';
import { destinationError, reservedReason, slugShapeError } from './reserved';

const BASE = '/short-urls';
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function ShortUrlsLayout() {
  const q = useShortUrls();
  const { session } = useShell();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const open = pathname.startsWith(`${BASE}/`) && !pathname.endsWith('/new') ? decodeURIComponent(pathname.slice(BASE.length + 1).replace(/\/$/, '')) : null;
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<ShortUrl | null>(null);
  const del = useDeleteShortUrl();
  const all = q.data ?? [];
  const who = (email: string) => (email === session.email ? 'You' : email);

  const shown = useMemo(() => {
    const n = norm(query.trim());
    return n ? all.filter((r) => norm(`${r.slug} ${r.to}`).includes(n)) : all;
  }, [all, query]);

  const columns: Column<ShortUrl>[] = [
    { id: 'slug', header: 'Short URL', width: '15rem', cell: (r) => <span className="su-slug"><small>brickbot.ro/</small>{r.slug}</span>, sort: (a, b) => a.slug.localeCompare(b.slug) },
    { id: 'to', header: 'Goes to', cell: (r) => <span className="su-to" title={r.to}>{r.to}</span>, sort: (a, b) => a.to.localeCompare(b.to) },
    { id: 'edited', header: 'Last edited', cell: (r) => (r.editedBy ? <>{formatDateTime(r.editedAt)}<span className="su-who">{who(r.editedBy)}</span></> : <span className="su-who">Not edited in the CMS yet</span>), sort: (a, b) => a.editedAt.localeCompare(b.editedAt), secondary: true },
    { id: 'created', header: 'Created', cell: (r) => <>{formatDateTime(r.createdAt)}{r.createdBy && <span className="su-who">{who(r.createdBy)}</span>}</>, sort: (a, b) => a.createdAt.localeCompare(b.createdAt), secondary: true },
  ];

  return (
    <>
      <TablePage
        title="Short URLs"
        count={q.isSuccess ? `${shown.length} ${shown.length === 1 ? 'short URL' : 'short URLs'}` : undefined}
        action={<AppLink href={`${BASE}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New</AppLink>}
        toolbar={
          <div className="lp__search">
            <Icon name="search" />
            <input type="search" className="input input--search" aria-label="Search short URLs" placeholder="Search short URLs" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      >
        <Callout>Edits go live on the next <b>Publish</b> of the website, which rewrites its redirects. Any short URL can be deleted, the starting ones too.</Callout>
        <DataTable<ShortUrl>
          stack
          label="Short URLs" rows={shown} columns={columns} rowKey={(r) => r.slug} rowHref={(r) => `${BASE}/${r.slug}`} selectedKey={open}
          loading={q.isPending} error={q.isError} onRetry={() => void q.refetch()} defaultSort={{ id: 'slug', dir: 'asc' }}
          filtered={query.trim() !== ''} noResults={`No short URL matches “${query.trim()}”.`}
          empty={{ title: 'No short URLs yet.', body: 'Add one and brickbot.ro/<word> starts to redirect after the next Publish.', action: <AppLink href={`${BASE}/new`} className="btn btn--primary btn--sm"><Icon name="plus" />New short URL</AppLink> }}
          actions={(r) => <button type="button" className="iconbtn iconbtn--sm" aria-label={`Delete /${r.slug}`} onClick={() => setDeleting(r)}><Icon name="trash" /></button>}
        />
      </TablePage>
      <Outlet />
      {deleting && (
        <DeleteConfirm slug={deleting.slug} busy={del.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => { await del.mutateAsync(deleting.slug); setDeleting(null); if (open === deleting.slug) router.history.replace(BASE); }} />
      )}
    </>
  );
}

function DeleteConfirm({ slug, busy, onCancel, onConfirm }: { slug: string; busy: boolean; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const go = async () => { setError(null); try { await onConfirm(); } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Try again.'); } };
  return (
    <Dialog role="alertdialog" title={`Delete /${slug}?`} onClose={() => { if (!busy) onCancel(); }} initialFocus="[data-keep]"
      actions={
        <>
          <button type="button" className="btn btn--ghost" data-keep disabled={busy} onClick={onCancel}>Keep short URL</button>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void go()}>
            {busy ? <><span className="spin" aria-hidden="true" />Deleting</> : 'Delete short URL'}
          </button>
        </>
      }>
      <p>People who open <b>brickbot.ro/{slug}</b> will get a “not found” page after the next Publish. Links already shared will stop working. It can’t be undone.</p>
      {error && <p className="field__error" role="alert">Couldn’t delete it. {error}</p>}
    </Dialog>
  );
}

// ───────── the form dialog ─────────

interface UrlForm { slug: string; to: string }

export function ShortUrlNew() {
  const q = useShortUrls();
  if (q.isPending) return null;
  return <UrlDialog key="new" all={q.data ?? []} />;
}

export function ShortUrlEdit() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const q = useShortUrls();
  const router = useRouter();
  if (q.isPending) return null;
  const row = q.data?.find((r) => r.slug === slug);
  if (!row) {
    return (
      <Dialog title="This short URL is gone" onClose={() => router.history.replace(BASE)} actions={<button type="button" className="btn btn--primary" onClick={() => router.history.replace(BASE)}>Back to the list</button>}>
        <p>/{slug} no longer exists. Someone may have deleted or renamed it.</p>
      </Dialog>
    );
  }
  return <UrlDialog key={row.slug} row={row} all={q.data ?? []} />;
}

function UrlDialog({ row, all }: { row?: ShortUrl; all: ShortUrl[] }) {
  const router = useRouter();
  const create = useCreateShortUrl();
  const update = useUpdateShortUrl();
  const del = useDeleteShortUrl();
  const [confirm, setConfirm] = useState(false);
  const { session } = useShell();
  const close = () => router.history.replace(BASE);

  const validate = (f: UrlForm): Errors => {
    const e: Errors = {};
    const slug = f.slug.trim();
    const s = slugShapeError(slug);
    if (s) e.slug = s;
    else {
      const r = reservedReason(slug);
      if (r) e.slug = r;
      else if (slug !== row?.slug && all.some((x) => x.slug === slug)) e.slug = `/${slug} already exists. Edit that one instead, or pick another word.`;
    }
    const d = destinationError(f.to, slug);
    if (d) e.to = d;
    return e;
  };
  const form = useEditForm<UrlForm>({
    initial: { slug: row?.slug ?? '', to: row?.to ?? '' },
    validate,
    save: async (v) => {
      const input = { slug: v.slug.trim(), to: v.to.trim() };
      try { return await (row ? update.mutateAsync({ slug: row.slug, input }) : create.mutateAsync(input)); }
      catch (e) { if (e instanceof Error && /already exists/.test(e.message)) throw new FieldError('slug', e.message); throw e; }
    },
    onSaved: close,
  });
  const by = row ? (row.editedBy === session.email ? 'You' : row.editedBy) : null;

  return (
    <FormContext.Provider value={form}>
      <Dialog title={row ? `Edit /${row.slug}` : 'New short URL'} onClose={close} initialFocus="input"
        actions={
          <>
            {row && <button type="button" className="btn btn--ghost" disabled={form.saving} onClick={() => setConfirm(true)}><Icon name="trash" />Delete</button>}
            <button type="button" className="btn btn--ghost" disabled={form.saving} onClick={close}>Cancel</button>
            <button type="button" className="btn btn--primary" disabled={form.saving || (!!row && !form.dirty)} onClick={() => void form.save()}>
              {form.saving ? <><span className="spin" aria-hidden="true" />Saving</> : row ? 'Save' : 'Add short URL'}
            </button>
          </>
        }>
        <form className="su-form" noValidate onSubmit={(e) => { e.preventDefault(); void form.save(); }}>
          <TextField name="slug" label="Short address" placeholder="apply" hint={<>brickbot.ro/<b>{form.values.slug.trim() || 'word'}</b>{row ? '. Changing it breaks the old address.' : ''}</>} />
          <TextField name="to" label="Goes to" type="url" placeholder="https://" />
          {by && row && <p className="su-live">Last edited by <b>{by}</b>, {formatDateTime(row.editedAt)}.</p>}
          {form.saveError && <p className="field__error" role="alert">{form.saveError} Nothing you typed was lost: try again, or cancel and come back later.</p>}
          <button type="submit" className="sr-only" tabIndex={-1}>Save</button>
        </form>
      </Dialog>
      {confirm && row && (
        <DeleteConfirm slug={row.slug} busy={del.isPending} onCancel={() => setConfirm(false)}
          onConfirm={async () => { await del.mutateAsync(row.slug); setConfirm(false); close(); }} />
      )}
    </FormContext.Provider>
  );
}
