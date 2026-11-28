import { useMemo, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useSession } from '../../lib/data/hooks';
import { formatDate } from '../../lib/dates';
import { editedWhen } from '../../lib/format';
import { Tag } from '../../components/Tag';
import { Icon } from '../../components/icons';
import { Dialog, DataTable, TablePage } from '../../components/edit';
import type { Column } from '../../components/edit';
import { useAdminUsers, useCatalog, useDeactivate, useReactivate, useResendInvite } from './data/hooks';
import type { AdminUser, UserStatus } from './data/types';
import { deactivateBlock } from './guards';
import { useFlash } from './flash';
import { InvitePanel } from './InvitePanel';
import { AdminNote, PermTags, StatusBadge, statusLabel } from './parts';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const when = (iso: string | null) => (iso ? editedWhen(iso) : 'Never');

export function UsersPage() {
  const me = useSession().data?.email;
  const q = useAdminUsers();
  const catalog = useCatalog().data ?? [];
  const search = useRouterState({ select: (s) => s.location.search }) as { q?: unknown };
  const [query, setQuery] = useState(typeof search.q === 'string' ? search.q : '');
  const [status, setStatus] = useState<'all' | UserStatus>('all');
  const [perm, setPerm] = useState('all');
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);
  const [flash, show, clearFlash] = useFlash();
  const [failed, setFailed] = useState<string | null>(null);
  const resend = useResendInvite();
  const reactivate = useReactivate();

  const all = q.data ?? [];
  const shown = useMemo(() => {
    const n = norm(query.trim());
    return all.filter((u) => (status === 'all' || u.status === status) && (perm === 'all' || u.permissions.includes(perm)) && (!n || norm(u.email).includes(n)));
  }, [all, query, status, perm]);
  const filtered = query.trim() !== '' || status !== 'all' || perm !== 'all';
  const count = q.isPending ? '' : `${shown.length} ${shown.length === 1 ? 'member' : 'members'}${filtered ? ` of ${all.length}` : ''}`;

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setFailed(null);
    try { await fn(); show(done); } catch (e) { setFailed(e instanceof Error && e.message ? e.message : 'Try again.'); }
  };

  const columns: Column<AdminUser>[] = [
    { id: 'email', header: 'Email', sort: (a, b) => a.email.localeCompare(b.email), cell: (u) => <span className="adm-email">{u.email}{u.email === me && <Tag lit>You</Tag>}</span> },
    { id: 'permissions', header: 'Permissions', cell: (u) => <PermTags ids={u.permissions} /> },
    { id: 'status', header: 'Status', sort: (a, b) => a.status.localeCompare(b.status), cell: (u) => <StatusBadge status={u.status} /> },
    { id: 'last', header: 'Last sign-in', secondary: true, sort: (a, b) => (a.lastSignInAt ?? '').localeCompare(b.lastSignInAt ?? ''), cell: (u) => <span className="tnum">{when(u.lastSignInAt)}</span> },
    { id: 'added', header: 'Added', secondary: true, sort: (a, b) => a.addedAt.localeCompare(b.addedAt), cell: (u) => <span className="tnum">{formatDate(u.addedAt)}</span> },
  ];

  return (
    <>
      <TablePage
        title="Users"
        count={count}
        action={<button type="button" className="btn btn--primary" onClick={() => setInviting(true)}><Icon name="plus" />Invite member</button>}
        toolbar={
          <>
            <div className="lp__search"><Icon name="search" /><input type="search" className="input input--search" aria-label="Search members by email" placeholder="Search by email" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <label className="lp__filter"><span className="label">Status</span>
              <select className="input input--select input--sm" value={status} onChange={(e) => setStatus(e.target.value as 'all' | UserStatus)}>
                <option value="all">All statuses</option>
                {(['active', 'invited', 'deactivated'] as const).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </label>
            <label className="lp__filter"><span className="label">Permission</span>
              <select className="input input--select input--sm" value={perm} onChange={(e) => setPerm(e.target.value)}>
                <option value="all">Any permission</option>
                {catalog.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
              </select>
            </label>
          </>
        }
      >
        <AdminNote />
        {(flash || failed) && (
          <p className={failed ? 'field__error adm-flash' : 'adm-flash adm-flash--ok'} role={failed ? 'alert' : 'status'}>
            {failed ? <Icon name="alert" /> : <Icon name="check" />}
            <span>{failed ?? flash}</span>
            <button type="button" className="link" onClick={() => { clearFlash(); setFailed(null); }}>Dismiss</button>
          </p>
        )}
        <DataTable<AdminUser>
          stack
          label="Members"
          rows={shown}
          rowKey={(u) => u.id}
          columns={columns}
          loading={q.isPending}
          error={q.isError}
          onRetry={() => void q.refetch()}
          filtered={filtered}
          noResults="No member matches. Try another status or permission, or clear the search."
          empty={{ title: 'No members yet.', body: 'Invite the first one: they get an email to set a password.', action: <button type="button" className="btn btn--primary btn--sm" onClick={() => setInviting(true)}><Icon name="plus" />Invite member</button> }}
          defaultSort={{ id: 'email', dir: 'asc' }}
          actionsLabel="Actions"
          actions={(u) => {
            const block = deactivateBlock(u, all, me);
            return (
              <>
                {u.status === 'invited' && <button type="button" className="link" disabled={resend.isPending} onClick={() => void run(() => resend.mutateAsync(u.id), `Invite sent again to ${u.email}.`)}>Resend invite</button>}
                {u.status === 'deactivated'
                  ? <button type="button" className="link" disabled={reactivate.isPending} onClick={() => void run(() => reactivate.mutateAsync(u.id), `${u.email} can sign in again.`)}>Reactivate</button>
                  : <button type="button" className="link" disabled={!!block} title={block ?? undefined} aria-label={`Deactivate ${u.email}${block ? `. ${block}` : ''}`} onClick={() => setConfirm(u)}>Deactivate</button>}
              </>
            );
          }}
        />
      </TablePage>
      {inviting && <InvitePanel users={all} catalog={catalog} onClose={() => setInviting(false)} onSent={(email) => show(`Invite sent to ${email}.`)} />}
      {confirm && <DeactivateDialog user={confirm} onClose={() => setConfirm(null)} onDone={(email) => show(`${email} is deactivated.`)} />}
    </>
  );
}

function DeactivateDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: (email: string) => void }) {
  const deactivate = useDeactivate();
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setError(null);
    try { await deactivate.mutateAsync(user.id); onDone(user.email); onClose(); } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Try again.'); }
  };
  const busy = deactivate.isPending;
  return (
    <Dialog role="alertdialog" title={`Deactivate ${user.email}?`} onClose={() => { if (!busy) onClose(); }} initialFocus="[data-keep]"
      actions={
        <>
          <button type="button" className="btn btn--ghost" data-keep disabled={busy} onClick={onClose}>Keep active</button>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void go()}>
            {busy ? <><span className="spin" aria-hidden="true" />Deactivating</> : 'Deactivate'}
          </button>
        </>
      }>
      <p>This blocks <b>{user.email}</b> from signing in. The account is not deleted, so what they wrote and changed stays credited to them.</p>
      <p>You can reactivate it any time.</p>
      {error && <p className="field__error" role="alert">Couldn’t deactivate it. {error}</p>}
    </Dialog>
  );
}
