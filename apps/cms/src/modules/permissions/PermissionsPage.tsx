import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../lib/data/hooks';
import { Tag } from '../../components/Tag';
import { Icon } from '../../components/icons';
import { Dialog, TablePage } from '../../components/edit';
import { useAdminUsers, useCatalog, useSetPermissions } from '../users/data/hooks';
import type { AdminUser, PermissionDef } from '../users/data/types';
import { activeAdmins } from '../users/guards';
import { AdminNote, StatusBadge } from '../users/parts';
import { useFlash } from '../users/flash';

type Staged = Record<string, string[]>;
const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Users × permissions. Ticks are staged; one Save writes them all. */
export function PermissionsPage() {
  const me = useSession().data?.email;
  const q = useAdminUsers();
  const catalog = useCatalog();
  const save = useSetPermissions();
  const [staged, setStaged] = useState<Staged>({});
  const [hl, setHl] = useState<{ r: number; c: number } | null>(null);
  const [confirmSelf, setConfirmSelf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, show] = useFlash();

  const rows = useMemo(() => (q.data ?? []).filter((u) => u.status !== 'deactivated').sort((a, b) => a.email.localeCompare(b.email)), [q.data]);
  const cols = catalog.data ?? [];
  const current = (u: AdminUser) => staged[u.id] ?? u.permissions;
  const has = (u: AdminUser, p: string) => current(u).includes(p);

  // What would the member list look like if everything staged were saved?
  const after = useMemo(() => rows.map((u) => ({ ...u, permissions: staged[u.id] ?? u.permissions })), [rows, staged]);
  const adminsLeft = activeAdmins(after);

  const diffs = useMemo(() => {
    const out: { user: AdminUser; id: string; on: boolean }[] = [];
    for (const u of rows) for (const p of cols) {
      const was = u.permissions.includes(p.id), is = has(u, p.id);
      if (was !== is) out.push({ user: u, id: p.id, on: is });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, staged]);
  const dirty = diffs.length > 0;
  const granted = diffs.filter((d) => d.on).length, removed = diffs.length - granted;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const toggle = (u: AdminUser, p: string) => {
    const cur = current(u);
    const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p];
    setStaged((s) => {
      const copy = { ...s };
      if (same(next, u.permissions)) delete copy[u.id]; else copy[u.id] = next;
      return copy;
    });
    setError(null);
  };

  const removesOwnAdmin = diffs.some((d) => d.user.email === me && d.id === 'admin' && !d.on);
  const commit = async () => {
    setError(null);
    const changes = rows.filter((u) => staged[u.id]).map((u) => ({ userId: u.id, permissions: staged[u.id] }));
    try {
      await save.mutateAsync(changes);
      const n = diffs.length;
      setStaged({});
      show(`Saved ${n} ${n === 1 ? 'change' : 'changes'}.`);
    } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Try again.'); }
    setConfirmSelf(false);
  };
  /** Arrow keys move between the matrix's checkboxes (Tab still walks them all). */
  const gridKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const d = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
    if (!d) return;
    const r = Number(e.currentTarget.dataset.r), c = Number(e.currentTarget.dataset.c);
    const root = e.currentTarget.closest('table');
    for (let k = 1; k < 40; k++) {
      const next = root?.querySelector<HTMLInputElement>(`input[data-r="${r + d[0] * k}"][data-c="${c + d[1] * k}"]`);
      if (!next && !root?.querySelector(`input[data-r="${r + d[0] * k}"][data-c="${c + d[1] * k}"]`)) return;
      if (next && !next.disabled) { e.preventDefault(); next.focus(); return; }
    }
  };
  const onSave = () => { if (removesOwnAdmin) setConfirmSelf(true); else void commit(); };

  const loading = q.isPending || catalog.isPending;
  const failed = q.isError || catalog.isError;
  const lockReason = (u: AdminUser, p: PermissionDef) => (p.id === 'admin' && u.status === 'active' && has(u, 'admin') && adminsLeft.length === 1
    ? 'Last active admin: make someone else an admin first.' : null);
  const lockedAny = rows.some((u) => cols.some((p) => lockReason(u, p)));

  return (
    <div className="perm-page">
      <TablePage title="Permissions" count={loading ? '' : `${rows.length} ${rows.length === 1 ? 'member' : 'members'}, ${cols.length} permissions`}>
        <AdminNote />
        {flash && <p className="adm-flash adm-flash--ok" role="status"><Icon name="check" /><span>{flash}</span></p>}
        {failed ? (
          <div className="notice" role="alert"><span>Couldn’t load the permissions.</span><button type="button" className="link" onClick={() => { void q.refetch(); void catalog.refetch(); }}>Try again</button></div>
        ) : loading ? (
          <div className="dt" aria-busy="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 22, margin: 14, opacity: 1 - i * 0.14 }} />)}</div>
        ) : rows.length === 0 ? (
          <div className="dt__empty"><p className="dt__empty-t">No members to show.</p><p>Invite someone in Users and they appear here.</p></div>
        ) : (
          <div className="dt perm" onMouseLeave={() => setHl(null)}>
            <div className="dt__scroll perm__scroll" tabIndex={-1}>
              <table className="perm__table">
                <caption className="sr-only">Which permissions each member holds. Tick or untick, then save.</caption>
                <thead>
                  <tr>
                    <th scope="col" className="perm__corner">Member</th>
                    {cols.map((p, c) => (
                      <th key={p.id} scope="col" className="perm__colh" data-hl={hl?.c === c ? '' : undefined}>
                        <Tag>{p.id}</Tag>
                        <span className="perm__label">{p.label}</span>
                        <span className="perm__desc">{p.description}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u, r) => (
                    <tr key={u.id} className="perm__row" data-hl={hl?.r === r ? '' : undefined} data-dirty={staged[u.id] ? '' : undefined}>
                      <th scope="row" className="perm__user">
                        <span className="adm-email">{u.email}{u.email === me && <Tag lit>You</Tag>}</span>
                        {u.status === 'invited' && <StatusBadge status="invited" />}
                      </th>
                      {cols.map((p, c) => {
                        const reason = lockReason(u, p);
                        const was = u.permissions.includes(p.id), is = has(u, p.id);
                        return (
                          <td key={p.id} className="perm__cell" data-hl={hl?.c === c ? (hl.r === r ? 'both' : 'col') : hl?.r === r ? 'row' : undefined} data-changed={was !== is ? '' : undefined}
                            onMouseEnter={() => setHl({ r, c })}>
                            <label className="perm__box">
                              <input type="checkbox" data-r={r} data-c={c} checked={is} disabled={!!reason} onChange={() => toggle(u, p.id)} onKeyDown={gridKey}
                                onFocus={() => setHl({ r, c })} onBlur={() => setHl((h) => (h?.r === r && h.c === c ? null : h))}
                                aria-label={`${p.id} for ${u.email}`} aria-describedby={reason ? 'perm-lock' : undefined} title={reason ?? undefined} />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {lockedAny && <p className="adm-hint" id="perm-lock"><Icon name="alert" />The last active admin keeps <b>admin</b>. Give it to someone else first.</p>}
        {!loading && !failed && <p className="adm-hint">Deactivated members are not listed. Reactivate them in Users first.</p>}
      </TablePage>

      <div className="perm__bar" data-state={save.isPending ? 'busy' : error ? 'error' : dirty ? 'dirty' : 'clean'} hidden={!dirty && !save.isPending && !error}>
        <div className="perm__info">
          <p className="sbar__status" role="status">
            {save.isPending ? <><span className="spin spin--sm" aria-hidden="true" />Saving…</>
              : <><span className="led led--dirty" aria-hidden="true" /><span className="tnum">{diffs.length} {diffs.length === 1 ? 'change' : 'changes'}</span><span className="perm__sum">{[granted && `${granted} granted`, removed && `${removed} removed`].filter(Boolean).join(', ')}</span></>}
          </p>
          {error && <p className="sbar__err" role="alert"><Icon name="alert" /><span>Couldn’t save: {error} <span className="sbar__next">Your ticks are kept. Press Save to try again.</span></span></p>}
        </div>
        <div className="sbar__btns">
          <button type="button" className="btn btn--ghost btn--sm" disabled={save.isPending} onClick={() => { setStaged({}); setError(null); }}>Discard</button>
          <button type="button" className="btn btn--primary btn--sm" disabled={!dirty || save.isPending} onClick={onSave}>Save</button>
        </div>
      </div>

      {confirmSelf && (
        <Dialog role="alertdialog" title="Remove your own admin access?" onClose={() => { if (!save.isPending) setConfirmSelf(false); }} initialFocus="[data-keep]"
          actions={
            <>
              <button type="button" className="btn btn--ghost" data-keep disabled={save.isPending} onClick={() => setConfirmSelf(false)}>Keep admin</button>
              <button type="button" className="btn btn--primary" disabled={save.isPending} onClick={() => void commit()}>
                {save.isPending ? <><span className="spin" aria-hidden="true" />Saving</> : 'Remove my admin access'}
              </button>
            </>
          }>
          <p>You are about to remove <b>admin</b> from <b>{me}</b>. After you save, you can no longer open Users, Permissions or the Audit log. Another admin would have to give it back.</p>
          <p>The other changes in this batch are saved too.</p>
        </Dialog>
      )}
    </div>
  );
}
