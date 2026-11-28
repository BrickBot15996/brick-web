import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppLink } from '../AppLink';
import { PageHeader } from '../PageHeader';
import { Icon } from '../icons';

export interface Column<T> {
  /** Stable id (sort state, keys). */
  id: string;
  /** The column heading. */
  header: string;
  /** What the cell shows. */
  cell: (row: T) => ReactNode;
  /** Ascending comparator. Omit and the column is not sortable. */
  sort?: (a: T, b: T) => number;
  align?: 'start' | 'end';
  /** A CSS width such as "12rem"; the other columns share what is left. */
  width?: string;
  /** Hide this column in a narrow table (below 760px of table width), e.g. a secondary date. */
  secondary?: boolean;
}

export type SortState = { id: string; dir: 'asc' | 'desc' };

/**
 * A full-width table for modules where list → edit does not fit (short URLs, audit log, users, the permission matrix).
 *
 * - Sortable headers are buttons: click sorts ascending, again descending; `aria-sort` says which. A sort comparator
 *   per column keeps the module in charge of what "order" means (dates, numbers, case-insensitive names).
 * - `rowHref` makes the whole row a link (the first column's content is the real <a>, stretched over the row, so it is
 *   one tab stop and opens in a new tab with a modifier click). `actions` adds a trailing column of buttons that sit
 *   above that link.
 * - The header sticks to the viewport while the page scrolls (the table never scrolls inside a box of its own, except sideways on a narrow screen).
 * - `loading`, `error` and an empty list have their own states; `filtered` picks the "no match" wording when a search
 *   or filter emptied the list.
 */
export function DataTable<T>({ label, rows, columns, rowKey, rowHref, actions, actionsLabel = 'Actions', loading, error, onRetry, empty, noResults = 'Nothing matches.', filtered, defaultSort, selectedKey, stack }: {
  /** Names the table for screen readers (it is its caption). */
  label: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  actions?: (row: T) => ReactNode;
  actionsLabel?: string;
  loading?: boolean;
  /** True, or a message, when the list could not be loaded. */
  error?: boolean | string;
  onRetry?: () => void;
  empty: { title: string; body?: string; action?: ReactNode };
  /** Shown when `filtered` and no row is left. */
  noResults?: string;
  filtered?: boolean;
  defaultSort?: SortState;
  /** Marks one row as the current one (aria-current). */
  selectedKey?: string | null;
  /** Under ~760px render each row as a stacked card (labelled cells, actions visible) instead of scrolling sideways. */
  stack?: boolean;
}) {
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  const scroll = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  // A table wider than its box scrolls sideways inside it; otherwise the page scrolls and the header can stick.
  useLayoutEffect(() => {
    const box = scroll.current, table = box?.querySelector('table');
    if (!box || !table) return;
    const check = () => setWide(table.offsetWidth > box.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(box); ro.observe(table);
    return () => ro.disconnect();
  });
  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.id === sort.id);
    if (!col?.sort || !sort) return rows;
    const cmp = col.sort;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return rows.map((r, i) => ({ r, i })).sort((a, b) => sign * cmp(a.r, b.r) || a.i - b.i).map((x) => x.r);
  }, [rows, columns, sort]);

  const toggle = (id: string) => setSort((s) => (s?.id === id ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' }));
  const sortedCol = sort && columns.find((c) => c.id === sort.id);
  const span = columns.length + (actions ? 1 : 0);

  if (error) {
    return (
      <div className="notice" role="alert">
        <span>{typeof error === 'string' ? error : 'Couldn’t load the list.'}</span>
        {onRetry && <button type="button" className="link" onClick={onRetry}>Try again</button>}
      </div>
    );
  }
  if (!loading && rows.length === 0) {
    return filtered
      ? <p className="dt__none" role="status">{noResults}</p>
      : (
        <div className="dt__empty">
          <p className="dt__empty-t">{empty.title}</p>
          {empty.body && <p>{empty.body}</p>}
          {empty.action}
        </div>
      );
  }

  return (
    <div className={`dt${stack ? ' dt--stack' : ''}`}>
      <div className="dt__scroll" ref={scroll} data-x={wide ? '' : undefined} tabIndex={-1}>
        <table className="dt__table" aria-busy={loading || undefined}>
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {columns.map((c) => {
                const dir = sort?.id === c.id ? sort.dir : null;
                return (
                  <th key={c.id} scope="col" className={`dt__th ${c.align === 'end' ? 'dt__th--end' : ''} ${c.secondary ? 'dt__sec' : ''}`} style={c.width ? { width: c.width } : undefined}
                    aria-sort={c.sort ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : undefined}>
                    {c.sort ? (
                      <button type="button" className="dt__sort" onClick={() => toggle(c.id)}>
                        {c.header}
                        <Icon name={dir === 'desc' ? 'down' : 'up'} className={`i dt__arrow ${dir ? 'dt__arrow--on' : ''}`} />
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
              {actions && <th scope="col" className="dt__th dt__th--act"><span className="sr-only">{actionsLabel}</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading && [0, 1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="dt__skel" aria-hidden="true">
                <td colSpan={span}><div className="skeleton" style={{ height: 22, opacity: 1 - i * 0.14 }} /></td>
              </tr>
            ))}
            {!loading && sorted.map((row) => {
              const key = rowKey(row);
              const href = rowHref?.(row);
              return (
                <tr key={key} className="dt__row" data-link={href ? true : undefined} aria-current={selectedKey === key ? 'true' : undefined}>
                  {columns.map((c, i) => (
                    <td key={c.id} data-label={typeof c.header === 'string' ? c.header : undefined} className={`dt__td ${c.align === 'end' ? 'dt__td--end' : ''} ${c.secondary ? 'dt__sec' : ''}`}>
                      {i === 0 && href ? <AppLink href={href} className="dt__link">{c.cell(row)}</AppLink> : c.cell(row)}
                    </td>
                  ))}
                  {actions && <td className="dt__td dt__td--act"><span className="dt__acts">{actions(row)}</span></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{sortedCol && sort ? `Sorted by ${sortedCol.header}, ${sort.dir === 'asc' ? 'ascending' : 'descending'}.` : ''}</p>
    </div>
  );
}

/**
 * The page around a DataTable: heading, a count, the primary action (a "New" link) and a toolbar slot for search and
 * filters. Plain column layout, no list/detail split. Put it as the route component of a table-style module or tab.
 */
export function TablePage({ title, count, action, toolbar, children }: {
  title: string;
  /** Under the heading, e.g. "14 short URLs". */
  count?: string;
  /** The "New" button (an AppLink styled as .btn). */
  action?: ReactNode;
  /** Search and filter controls. */
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tp" aria-label={title}>
      <PageHeader sub={count ? <span className="tnum" role="status">{count}</span> : undefined} actions={action} />
      {toolbar && <div className="tp__tools">{toolbar}</div>}
      {children}
    </section>
  );
}
