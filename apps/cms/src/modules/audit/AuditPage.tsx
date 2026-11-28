import { useMemo, useState } from 'react';
import { useSession } from '../../lib/data/hooks';
import { formatDateTime } from '../../lib/dates';
import { FormContext, useEditForm } from '../../lib/form';
import type { Errors } from '../../lib/form';
import { editedWhen } from '../../lib/format';
import { Tag } from '../../components/Tag';
import { Icon } from '../../components/icons';
import { DataTable, DateField, SelectField, TablePage } from '../../components/edit';
import type { Column } from '../../components/edit';
import { SidePanel } from '../users/parts';
import { useAuditActors, useAuditLog, useAuditTables } from './data/hooks';
import { diffEntry } from './data/diff';
import { showValue, tableLabel } from './data/labels';
import type { AuditAction, AuditEntry, AuditFilters } from './data/types';

const ACTION: Record<AuditAction, string> = { insert: 'Insert', update: 'Update', delete: 'Delete' };
const EMPTY: AuditFilters = { user: '', table: '', from: '', to: '' };

function validate(v: AuditFilters): Errors {
  const e: Errors = {};
  if (v.from && v.to && v.to < v.from) e.to = 'End date is before the start date.';
  return e;
}

export function AuditPage() {
  const me = useSession().data?.email;
  const actors = useAuditActors().data ?? [];
  const tables = useAuditTables().data ?? [];
  const form = useEditForm<AuditFilters>({ initial: EMPTY, validate, save: async () => undefined });
  // A reversed range is held back until fixed, so the table never flickers to empty while typing.
  const applied: AuditFilters = useMemo(() => {
    const v = form.values;
    const bad = v.from && v.to && v.to < v.from;
    return { user: v.user, table: v.table, from: v.from, to: bad ? '' : v.to };
  }, [form.values]);
  const filtered = !!(applied.user || applied.table || applied.from || applied.to);
  const log = useAuditLog(applied);
  const rows = useMemo(() => log.data?.pages.flatMap((p) => p.rows) ?? [], [log.data]);
  const total = log.data?.pages[log.data.pages.length - 1]?.total ?? 0;
  const [open, setOpen] = useState<AuditEntry | null>(null);

  const who = (e: AuditEntry) => <span className="adm-email">{e.actorEmail}{e.actorEmail === me && <Tag lit>You</Tag>}</span>;
  const columns: Column<AuditEntry>[] = [
    { id: 'when', header: 'When', sort: (a, b) => a.at.localeCompare(b.at), cell: (e) => <span className="tnum aud-when" title={formatDateTime(e.at)}><b>{editedWhen(e.at)}</b></span> },
    { id: 'who', header: 'Who', sort: (a, b) => a.actorEmail.localeCompare(b.actorEmail), cell: who },
    { id: 'table', header: 'Area', sort: (a, b) => tableLabel(a.table).localeCompare(tableLabel(b.table)), cell: (e) => tableLabel(e.table) },
    { id: 'action', header: 'Action', cell: (e) => <Tag>{ACTION[e.action]}</Tag> },
    { id: 'item', header: 'Item', cell: (e) => <span className="aud-item">{e.item}</span> },
  ];

  return (
    <>
      <TablePage
        title="Audit log"
        count={log.isPending ? '' : `${total} ${total === 1 ? 'change' : 'changes'}${filtered ? ' match' : ''}`}
        toolbar={
          <FormContext.Provider value={form}>
            <form className="aud-filters" onSubmit={(e) => e.preventDefault()} aria-label="Filter the audit log">
              <SelectField name="user" label="Who" placeholder="Everyone" options={actors.map((a) => ({ value: a, label: a === me ? `${a} (You)` : a }))} />
              <SelectField name="table" label="Area" placeholder="All areas" options={tables.map((t) => ({ value: t.id, label: t.label }))} />
              <DateField name="from" label="From" optional max={form.values.to || undefined} />
              <DateField name="to" label="To" optional min={form.values.from || undefined} />
              {filtered && <button type="button" className="link aud-clear" onClick={() => { form.set('user', ''); form.set('table', ''); form.set('from', ''); form.set('to', ''); }}>Clear filters</button>}
            </form>
          </FormContext.Provider>
        }
      >
        <DataTable<AuditEntry>
          stack
          label="Changes, newest first"
          rows={rows}
          rowKey={(e) => e.id}
          columns={columns}
          loading={log.isPending}
          error={log.isError}
          onRetry={() => void log.refetch()}
          filtered={filtered}
          noResults="No change matches these filters. Widen the dates or clear a filter."
          empty={{ title: 'Nothing recorded yet.', body: 'Changes to content and permissions appear here as they happen.' }}
          defaultSort={{ id: 'when', dir: 'desc' }}
          selectedKey={open?.id}
          actionsLabel="Details"
          actions={(e) => <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(e)} aria-label={`See what changed: ${ACTION[e.action]} ${e.item}, ${formatDateTime(e.at)}`}>Changes</button>}
        />
        {!log.isPending && !log.isError && rows.length > 0 && (
          <div className="aud-more">
            <p className="tnum" role="status">Showing {rows.length} of {total}</p>
            {log.hasNextPage && (
              <button type="button" className="btn btn--ghost btn--sm" disabled={log.isFetchingNextPage} onClick={() => void log.fetchNextPage()}>
                {log.isFetchingNextPage ? <><span className="spin spin--sm" aria-hidden="true" />Loading</> : 'Load more'}
              </button>
            )}
          </div>
        )}
      </TablePage>
      {open && <EntryPanel entry={open} me={me} onClose={() => setOpen(null)} />}
    </>
  );
}

function EntryPanel({ entry, me, onClose }: { entry: AuditEntry; me: string | undefined; onClose: () => void }) {
  const [all, setAll] = useState(false);
  const rows = useMemo(() => diffEntry(entry), [entry]);
  const changed = rows.filter((r) => r.changed);
  const hidden = rows.length - changed.length;
  const shown = all ? rows : changed;
  const verb = entry.action === 'insert' ? 'added' : entry.action === 'delete' ? 'removed' : 'changed';
  return (
    <SidePanel title={entry.item} onClose={onClose} footer={<button type="button" className="btn btn--ghost" onClick={onClose}>Close</button>}>
      <p className="aud-sum">
        <b>{entry.actorEmail === me ? 'You' : entry.actorEmail}</b> {verb} this in <b>{tableLabel(entry.table)}</b>, {formatDateTime(entry.at)}.
      </p>
      {shown.length === 0 ? <p className="adm-hint">No field values were recorded for this change.</p> : (
        <ul className="aud-diff">
          {shown.map((r) => (
            <li key={r.key} className="aud-diff__row" data-changed={r.changed ? '' : undefined}>
              <p className="aud-diff__label">{r.label}</p>
              {entry.action !== 'insert' && (
                <p className="aud-diff__line"><span className="aud-diff__tag">Before</span><span className={`aud-diff__val ${r.changed ? 'aud-diff__val--old' : ''}`}>{showValue(r.before)}</span></p>
              )}
              {entry.action !== 'delete' && (
                <p className="aud-diff__line"><span className="aud-diff__tag">{entry.action === 'update' ? 'After' : 'Value'}</span><span className={`aud-diff__val ${r.changed ? 'aud-diff__val--new' : ''}`}><span className={r.changed ? 'aud-hi' : undefined}>{showValue(r.after)}</span></span></p>
              )}
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && (
        <button type="button" className="link aud-toggle" onClick={() => setAll((v) => !v)}>
          {all ? 'Hide unchanged fields' : `Show ${hidden} unchanged ${hidden === 1 ? 'field' : 'fields'}`}
        </button>
      )}
      {entry.action === 'update' && changed.length > 0 && <p className="adm-hint"><Icon name="check" />{changed.length} {changed.length === 1 ? 'field' : 'fields'} changed.</p>}
    </SidePanel>
  );
}
