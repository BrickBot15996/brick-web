import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../../components/icons';
import { Tag } from '../../components/Tag';
import type { UserStatus } from './data/types';

const STATUS: Record<UserStatus, string> = { active: 'Active', invited: 'Invited', deactivated: 'Deactivated' };
export const statusLabel = (s: UserStatus) => STATUS[s];

/** A status as a small lamp plus a word, so colour is never the only signal. */
export function StatusBadge({ status }: { status: UserStatus }) {
  return <span className="adm-status" data-status={status}><span className="adm-lamp" aria-hidden="true" />{STATUS[status]}</span>;
}

/** A permission id as a Condensed tag. */
export function PermTag({ id }: { id: string }) {
  return <Tag>{id}</Tag>;
}
export function PermTags({ ids }: { ids: readonly string[] }) {
  if (!ids.length) return <span className="adm-none">None</span>;
  return <span className="adm-tags">{ids.map((p) => <PermTag key={p} id={p} />)}</span>;
}

/** The reminder that `admin` is not an editing right. */
export function AdminNote({ children }: { children?: ReactNode }) {
  return (
    <p className="callout adm-note">
      <Icon name="alert" />
      <span>{children ?? <><b>admin</b> opens Users, Permissions and the Audit log, and nothing else. It does not let someone edit content: that needs <b>cms.website</b> or <b>cms.links</b> too.</>}</span>
    </p>
  );
}

/**
 * A panel that slides in from the right (full width on a phone). Modal: focus moves in and is trapped, Escape closes,
 * focus returns to what opened it.
 */
export function SidePanel({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const id = useId();
  useEffect(() => {
    from.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    box.current?.querySelector<HTMLElement>('input, button, select')?.focus();
    return () => {
      document.body.style.overflow = '';
      const el = from.current;
      if (el && document.contains(el)) el.focus();
    };
  }, []);
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(box.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') ?? []);
    if (!f.length) return;
    const a = document.activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  return (
    <div className="sidep__scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sidep" role="dialog" aria-modal="true" aria-labelledby={id} ref={box} onKeyDown={key}>
        <div className="sidep__head">
          <h2 id={id} className="sidep__title">{title}</h2>
          <button type="button" className="iconbtn iconbtn--sm" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="sidep__body">{children}</div>
        <div className="sidep__foot">{footer}</div>
      </div>
    </div>
  );
}
